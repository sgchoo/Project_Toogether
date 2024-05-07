import { AxiosError } from 'axios';
import * as API from '@utils/api';
import { setCookie } from '@utils/cookie';
import { Cookie, SignInForm, SignUpForm, ErrorResponse } from '@type/index';
import {
  resGroupEventStore,
  useGroupEventStore,
  useNowCalendarStore,
  useSocialEventStore,
  useUserInfoStore,
} from '@store/index';

export async function signUp(formData: SignUpForm) {
  try {
    const { useremail, nickname, password } = formData;

    const res = await API.post(`/auth/signup`, {
      useremail,
      nickname,
      password,
    });
    if (!res) throw new Error('가입 실패');

    return true;
  } catch (e) {
    const err = e as AxiosError;

    if (err.response) {
      const data = err.response.data as ErrorResponse;
      console.error(data); //debug//
      alert(data.message);
    }
  }
}

export async function logIn(formData: SignInForm) {
  try {
    const { useremail, password } = formData;

    const res = await API.post(`/auth/login`, {
      useremail,
      password,
    });
    if (!res) throw new Error('가입 실패');

    /*
    TODO 
    access 토큰 유효시간을 백엔드에서 발급한 refresh 토큰과 동일하게 설정, 이후 만료된 access 토큰을 http header 담아서 보내면 refresh 시간 내에는 백엔드에서 자동 발급 
    따라서, 로그아웃을 수동으로 할 경우 백엔드에 저장된 refresh 토큰을 삭제하는 요청을 보낼 필요가 있음
    위의 경우, 백엔드에서 DB의 부하가 커질 수 있어 refresh 토큰을 프론트에서 쿠키에 저장해두고 access 토큰이 만료되면 http 헤더에 access 대신 refresh 토큰을 보내고, 
    백엔드가 refresh 토큰을 받았을 떄는 토큰이 유효한지 확인한 뒤에 access 토큰을 새로 발급해서 보내주는 것이 좋지 않나? 
    */
    const accessToken: Cookie = {
      name: 'accessToken',
      value: res.data.accessToken,
      options: {
        path: '/',
        maxAge: 3600,
        secure: true,
        sameSite: 'none',
      },
    };

    // const refreshToken: Cookie = {
    //   name: 'refreshToken',
    //   value: res.data.refreshToken,
    //   options: {
    //     path: '/',
    //     maxAge: 5184000,
    //     secure: true,
    //     sameSite: 'none',
    //   },
    // };

    setCookie(accessToken);
    // setCookie(refreshToken);

    return true;
  } catch (e) {
    const err = e as AxiosError;

    if (err.response) {
      const data = err.response.data as ErrorResponse;
      console.error(data); //debug//
      alert(data.message);
    }
  }
}

export async function firstRender() {
  try {
    const {
      data: [db_user],
    } = await API.get(`/auth/all`);
    if (!db_user) throw new Error('USER - firstRender (유저 정보 db 조회 실패)');
    console.log(`USER - firstRender 성공`, db_user);

    useUserInfoStore.getState().setUserInfo(db_user);
    useNowCalendarStore.getState().setNowCalendar('All');
    useSocialEventStore.getState().setSocialEvents(db_user.userCalendarId.socialEvents);

    const allGroupEvents = [];

    for (const calendar of db_user.userCalendarId.groupCalendar) {
      if (calendar.groupEvents) {
        allGroupEvents.push(
          ...calendar.groupEvents.map((event: resGroupEventStore) => ({
            groupEventId: event.groupEventId,
            title: event.title,
            member: event.member || [],
            pinned: event.pinned || false,
            alerts: event.alerts || null,
            attachment: event.attachment || null,
            color: event.color,
            startAt: event.startAt,
            endAt: event.endAt,
          })),
        );
      }
    }
    useGroupEventStore.getState().setGroupEvents(allGroupEvents);

    return true;
  } catch (e) {
    const err = e as AxiosError;

    if (err.response?.status === 400) {
      console.error(err.response);
      alert('USER - firstRender 실패 : 토큰 정보가 일치하지 않습니다');
      return false;
    } else {
      const data = err.response?.data as ErrorResponse;
      console.error(data); //debug//
      alert(data.message);
    }
  }
}
