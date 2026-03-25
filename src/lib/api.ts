import merge from "lodash/merge";
import { endApiRequest, startApiRequest } from "@/lib/apiLoader";
const base_url = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim().replace(/\/+$/, "");

const URLS = {
  authRegister: `${base_url}/auth/register`,
  authLogin: `${base_url}/auth/login`,
  authForgotPassword: `${base_url}/auth/forgot-password`,
  authResetPassword: `${base_url}/auth/reset-password`,
  users: `${base_url}/users`,
  labours: `${base_url}/labours`,
  projects: `${base_url}/projects`,
  attendance: `${base_url}/attendance`,
  payments: `${base_url}/payments`,
  dashboardSummary: `${base_url}/dashboard/summary`,
};

export function encodeQueryData(data: any = {}) {
  const params = new URLSearchParams();
  for (const key in data) {
    const value = data[key];
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  return "?" + params.toString();
}

export function tryParseJSON(json: string) {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error(`Failed to parse unexpected JSON response: ${json}`);
  }
}

const getResponseBody = (response: Response) => {
  const contentType = response.headers.get("content-type");
  return contentType && contentType.indexOf("json") >= 0
    ? response.clone().text().then(tryParseJSON)
    : response.clone().text();
};

class ResponseError extends Error {
  status: number;
  response: Response;
  body: any;
  constructor(status: number, response: Response, body: any) {
    super("ResponseError");
    this.name = "ResponseError";
    this.status = status;
    this.response = response;
    this.body = body;
  }
}

export const retrieveToken = async (ctx: any = undefined) => {
  return typeof window !== 'undefined' ? localStorage.getItem('token') || "" : "";
};

const makeHeadersAndParams = async (params: any, auth: boolean, type?: string, ctx?: any) => {
  let headers: any = {};
  let restParams = params;

  if (!Array.isArray(params)) {
    ({ headers = {}, ...restParams } = params || {});
  }

  const baseHeaders =
    type === "file"
      ? {}
      : {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

  let headerConfig = new Headers(merge(baseHeaders, headers));

  if (auth && !headerConfig.get("Authorization")) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : "";
    if (token) headerConfig.set("Authorization", `Bearer ${token}`);
  }

  return { headers: headerConfig, params: restParams };
};

const request = async ({
  url = "",
  method = "GET",
  params = {},
  auth = true,
  type,
  ctx = undefined,
}: any) => {
  const shouldTrackLoader = typeof window !== "undefined";
  if (shouldTrackLoader) startApiRequest();

  const { headers, params: apiParams } = await makeHeadersAndParams(
    params,
    auth,
    type,
    ctx
  );
  
  const options: any = {
    method,
    headers,
  };
  
  if (method === "GET") {
    if (Object.keys(apiParams).length > 0) url += encodeQueryData(apiParams);
  } else {
    options["body"] = type === "file" ? params : JSON.stringify(apiParams);
  }

  return fetch(url, options)
    .then((response) => {
      return getResponseBody(response).then((body = {}) => {
        if (response.ok) {
          return { body, status: response.status, data: body }; // alias body to data for seamless property picking
        } else {
          throw new ResponseError(response.status, response, body);
        }
      });
    })
    .finally(() => {
      if (shouldTrackLoader) endApiRequest();
    });
};

const _request = request;

const get = (url: string, params?: any, auth = true, ctx: any = undefined) => {
  return _request({ method: "GET", url, params, auth, ctx });
};

const post = (url: string, params?: any, auth = true, type?: string) => {
  return _request({ method: "POST", url, params, auth, type });
};

const put = (url: string, params?: any, auth = true) => {
  return _request({ method: "PUT", url, params, auth });
};

const patch = (url: string, params?: any, auth = true) => {
  return _request({ method: "PATCH", url, params, auth });
};

const _delete = (url: string, params?: any, auth = true) => {
  return _request({ method: "DELETE", url, params, auth });
};

const apiClient = {
  URLS,
  get,
  post,
  put,
  patch,
  delete: _delete,
  raw: _request,
};

export default apiClient;
