import { AxiosError } from 'axios';
import { UUID } from 'crypto';

import useToast from '@hooks/useToast';
import * as API from '@utils/api';
import { ImageFile, reqEventFeed, EventFeed, reqComment } from '@type/index';
import { useEventFeedListStore } from '@store/index';

interface FeedImage {
  imageSrc: string;
}

export async function getAllFeedInCalnedar(calendarId: UUID) {
  try {
    const { data: res } = await API.get(`/feed/get/calendar/${calendarId}`);
    if (!res) throw new Error('FEED - getAllFeedInCalendar : ( DB 캘린더 피드 불러오기 실패)');
    console.log(`FEED - getAllFeedInCalendar 성공`, res);

    return res;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`캘린더 전체 피드 받아오기 에러`, err); //debug//
    useToast('warning', '캘린더의 모든 피드를 가져오는데 실패했습니다.');
  }
}

export async function getAllFeedInEvent(groupEventId: UUID) {
  try {
    const { data: res } = await API.get(`/feed/get/groupevent/${groupEventId}`);
    if (!res) throw new Error(`FEED - getAllFeedInEvent 실패 (DB 피드 불러오기 실패)`);
    console.log(`FEED - getAllFeedInEvent 성공 :`, res); //debug//

    useEventFeedListStore.getState().setEventFeedList(res);

    return res;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`특정 일정 전체 피드 받아오기 에러`, err); //debug//
    useToast('warning', '해당 일정의 피드 정보를 가져오는데 실패했습니다.');
  }
}

export async function getOneFeed(feedId: UUID) {
  try {
    const { data: res } = await API.get(`/feed/get/detail/${feedId}`);
    if (!res) throw new Error(`FEED - getOneFeed 실패 (DB 피드 불러오기 실패)`);

    console.log(`FEED - getOneFeed 성공 :`, res); //debug//

    return res;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`특정 피드 정보 가져오기 에러`, err); //debug//
    useToast('warning', '피드 정보를 가져오는데 실패했습니다.');
  }
}

export async function createEventFeed({
  groupEventId,
  feedType,
  title,
  content,
  images,
}: reqEventFeed) {
  try {
    const feedData = new FormData();
    feedData.append('feedType', feedType.toString());
    feedData.append('title', title);
    feedData.append('content', content);

    images.forEach((img: ImageFile) => {
      if (img.file) feedData.append('images', img.file);
    });

    const { data: res } = await API.post(`/feed/create/${groupEventId}`, feedData);
    if (!res) throw new Error(`FEED - createEventFeed 실패 (DB 피드 생성 실패)`);
    console.log(`FEED - createEventFeed 성공 :`, res); //debug//

    const EventFeeds = useEventFeedListStore.getState().eventFeedList;
    useEventFeedListStore.getState().setEventFeedList([
      ...EventFeeds,
      {
        feedId: res.feed.feedId,
        feedType: res.feed.feedType,
        title: res.feed.title,
        content: res.feed.content,
        images: res.feedImages.map((img: FeedImage) => ({ imageSrc: img.imageSrc })),
        createdAt: res.feed.createdAt,
        thumbnail: res.feed.user.thumbnail,
        nickname: res.feed.user.nickname,
      },
    ]);

    useToast('success', '피드가 등록되었습니다.');

    return true;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`피드 등록 실패`, err); //debug//
    useToast('warning', '피드 등록에 실패했습니다.');
  }
}

export async function updateEventFeed({
  feedId,
  feedType,
  title,
  content,
  // images,    //TODO 업데이트할 이미지 URI 전송하기
}: EventFeed) {
  try {
    const { data: res } = await API.patch(`/feed/update/${feedId}`, {
      feedType: feedType || 1,
      title,
      content,
      // images
    });
    if (!res) throw new Error(`FEED - updateEventFeed 실패 (DB 피드 수정 실패)`);
    console.log(`FEED - updateEventFeed 성공 :`, res); //debug//
    useToast('success', '피드를 수정했습니다.');

    return true;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`피드 업데이트 에러`, err); //debug//
    useToast('warning', '피드 수정에 실패했습니다.');
  }
}

export async function removeEventFeed({ feedId }: EventFeed) {
  try {
    const { data: res } = await API.patch(`/feed/create/${feedId}`);
    if (!res) throw new Error(`FEED - removeEventFeed 실패 (DB 피드 삭제 실패)`);
    console.log(`FEED - removeEventFeed 성공 :`, res); //debug//
    useToast('error', '피드를 삭제했습니다.');

    return true;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`피드 삭제 에러`, err); //debug//
    useToast('warning', '피드를 삭제하는데 실패했습니다.');
  }
}

// ************************************ 댓글

export async function createFeedComment({ feedId, content }: reqComment) {
  try {
    const res = await API.post(`/feed/comment/create/${feedId}`, { content });
    if (!res) throw new Error('COMMENT - createFeedComment 실패 : (DB 댓글 등록 실패)');
    console.log(`COMMENT - createFeedComment 성공 :`, res); //debug//
    useToast('success', '댓글이 등록되었습니다.');

    return true;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`댓글 등록 에러`, err); //debug//
    useToast('warning', '댓글 등록에 실패했습니다.');
  }
}

export async function getFeedComment(feedId: UUID) {
  try {
    const { data: res } = await API.get(`/feed/comment/${feedId}`);
    if (!res) throw new Error('COMMENT - getFeedComment 실패 : (DB 댓글 불러오기 실패)');
    console.log(`COMMENT - getFeedComment 성공 :`, res); //debug//

    return res;
  } catch (e) {
    const err = e as AxiosError;
    console.error(`피드 댓글 불러오기 실패`, err); //debug//
    useToast('warning', '댓글 목록을 가져오는데 실패했습니다.');
  }
}
