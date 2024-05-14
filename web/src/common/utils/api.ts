import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getCookie } from '@utils/cookie';

export type ErrorResponse = {
  message: string;
};
interface Params {
  [key: string]: unknown;
}

interface Data {
  [key: string]: unknown;
}

const Server_Url = `${process.env.REACT_APP_SERVER_URL}:${process.env.REACT_APP_SERVER_PORT}`;
const Web_Url = process.env.REACT_APP_HOST_URL;

const axiosInstance = axios.create({
  baseURL: Server_Url,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url?.endsWith('/login') || config.url?.endsWith('/signup')) {
      return config;
    }

    // const token = getCookie('accessToken');
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인 해주세요.');
      window.location.href = `${Web_Url}/signin`;
    }
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (error.config?.data) {
        const data = JSON.parse(error.config.data);
        console.log(`data`, data);
        if (data.kakaoAccessToken === null) {
          return console.log(`카카오 에러 핸들링`); //debug//
        }
        if ('useremail' in data && 'password' in data) {
          console.log(`errer`, error);
          const err = error.response.data as ErrorResponse;
          alert(err.message);
          return;
        }
      }
      window.alert('인증 정보가 유효하지 않습니다. 다시 로그인해 주세요.');
      window.location.href = `${Web_Url}/signin`;
    }
  },
);

// endpoint : Server_Url 뒤에 오는 path
// ex) 로그인일 때, endpoint는 '/login'
//     const response = await get('/login');

async function get(endpoint: string, params?: Params): Promise<AxiosResponse> {
  if (params) console.log(`%cGET 요청 ${Server_Url + endpoint + '/' + params}`, 'color: #a25cd1;');
  else console.log(`%cGET 요청 ${Server_Url + endpoint}`, 'color: #a25cd1;');

  return axiosInstance.get(endpoint, { params });
}

async function post(endpoint: string, data: Data | FormData): Promise<AxiosResponse> {
  let config = {};
  if (data instanceof FormData) {
    config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    console.log(`%cPOST 요청: ${Server_Url + endpoint}`, 'color: #296aba;');
    console.log(`%cPOST 요청 데이터: `, FormData, 'color: #296aba;');
  } else {
    const bodydata = JSON.stringify(data);

    console.log(`%cPOST 요청: ${Server_Url + endpoint}`, 'color: #296aba;');
    console.log(`%cPOST 요청 데이터: ${bodydata}`, 'color: #296aba;');
  }

  return axiosInstance.post(endpoint, data, config);
}

async function patch(endpoint: string, data?: Data | FormData): Promise<AxiosResponse> {
  let config = {};
  if (data instanceof FormData) {
    config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    console.log(`%cPATCH 요청: ${Server_Url + endpoint}`, 'color: #059c4b;');
    console.log(`%cPATCH 요청 데이터: `, FormData, 'color: #059c4b;');
  } else if (data) {
    const bodydata = JSON.stringify(data);

    console.log(`%cPATCH 요청: ${Server_Url + endpoint}`, 'color: #059c4b;');
    console.log(`%cPATCH 요청 데이터: ${bodydata}`, 'color: #059c4b;');
  }

  return axiosInstance.patch(endpoint, data, config);
}

async function del(endpoint: string, params?: Params): Promise<AxiosResponse> {
  if (params)
    console.log(`%cDELETE 요청 ${Server_Url + endpoint + '/' + params}`, 'color: #c36999');
  else console.log(`%cDELETE 요청 ${Server_Url + endpoint}`, 'color: #c36999');

  return axiosInstance.delete(endpoint, params);
}

// 아래처럼 export한 후, import * as API 방식으로 가져오면,
// API.get, API.post 로 쓸 수 있음.
export { get, post, patch, del as delete };
