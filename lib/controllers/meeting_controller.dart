import 'package:calendar/api/calendar_delete_service.dart';
import 'package:calendar/api/comment_service.dart';
import 'package:calendar/api/delete_event_service.dart';
import 'package:calendar/api/event_creates_service.dart';
import 'package:calendar/api/post_service.dart';
import 'package:calendar/controllers/calendar_controller.dart';
import 'package:calendar/models/comment.dart';
import 'package:calendar/models/post.dart';
import 'package:calendar/models/social_event.dart';
import 'package:calendar/screens/event_detail.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:syncfusion_flutter_calendar/calendar.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;

class CalendarAppointment {
  final Appointment appointment;
  final String calendarId;
  final String groupeventId;
  final bool isSocial;

  CalendarAppointment(
      {required this.appointment,
      required this.calendarId,
      required this.groupeventId,
      required this.isSocial});
}

class FeedWithId {
  final Feed feed;
  final String groupeventId;
  final String feedId;

  FeedWithId({
    required this.feed,
    required this.groupeventId,
    required this.feedId,
  });

  factory FeedWithId.fromJson(Map<String, dynamic> json, String groupeventId) {
    return FeedWithId(
      feed: Feed.fromJsonLoad(json), // json 객체 자체를 Feed.fromJson에 전달
      groupeventId: groupeventId,
      feedId: json['feedId'] as String,
    );
  }
}

class CommentWithFeedId {
  final Comment comment;
  final String feedId;

  CommentWithFeedId({
    required this.comment,
    required this.feedId,
  });
}

class MeetingController extends GetxController {
  final RxList<CalendarAppointment> calendarAppointments =
      <CalendarAppointment>[].obs;

  final DeleteEventService deleteEventService = DeleteEventService();
  final CalendarEventService eventService = CalendarEventService();
  final DeleteCalendarService deleteCalendarService = DeleteCalendarService();

///////////////////////////////////////피드 부분 /////////////////////////////////////////
  final FeedService feedService = FeedService();
  final RxList<FeedWithId> feeds = <FeedWithId>[].obs;

  void addFeed(Feed newFeed, String groupEventId, String feedId) {
    var newFeeds = FeedWithId(
      feed: newFeed,
      groupeventId: groupEventId,
      feedId: feedId,
    );
    feeds.add(newFeeds);
    update(); // Trigger UI updates where MeetingController is being used
  }

  // 특정 이벤트와 관련된 모든 피드를 삭제하는 메소드
  Future<void> deleteFeedsForEvent(String groupEventId) async {
    List<FeedWithId> feedsToDelete =
        feeds.where((feed) => feed.groupeventId == groupEventId).toList();
    for (FeedWithId feed in feedsToDelete) {
      await deleteFeed(feed.feedId);
    }
  }

  // 피드를 삭제하는 메소드
  Future<void> deleteFeed(String feedId) async {
    bool isDeleted = await feedService.deleteFeed(feedId);
    if (isDeleted) {
      feeds.removeWhere((feed) => feed.feedId == feedId); // 로컬 리스트에서 피드 삭제
      update(); // GetX의 상태를 업데이트하여 UI를 갱신
      Get.snackbar('삭제 성공', '피드가 성공적으로 삭제 되었습니다.');
    } else {
      Get.snackbar('삭제 실패', '피드 삭제에 실패 하였습니다.');
    }
  }

  void loadFeedsForEvent(String groupEventId) async {
    try {
      var eventFeeds = await feedService.loadFeedsForGroup(groupEventId);
      if (eventFeeds.isNotEmpty) {
        feeds.assignAll(eventFeeds);
        update(); // 상태 업데이트 강제 실행
        print("success");
      } else {
        print("No feeds found for this groupEventId: $groupEventId");
      }
    } catch (e) {
      print("Failed to load feeds: $e");
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////// 댓 글 ///////////////////////////////////////////////
  final CommentService commentService = CommentService();
  final RxList<CommentWithFeedId> comments = <CommentWithFeedId>[].obs;

  // 특정 피드에 대한 댓글 로드 메서드
  Future<void> loadCommentsForFeed(String feedId) async {
    try {
      comments.clear(); // 기존 댓글 목록을 초기화
      var feedComments = await commentService.fetchComments(feedId);
      var mappedComments = feedComments
          .map((comment) => CommentWithFeedId(comment: comment, feedId: feedId))
          .toList();
      comments.assignAll(mappedComments);
      update(); // 리스너에게 업데이트 알림
    } catch (e) {
      print('댓글 로딩 에러: $e');
      Get.snackbar('오류', '댓글을 로드하는데 실패했습니다.');
    }
  }

  // 특정 피드에 댓글을 게시하는 메서드
  Future<void> addComment(
      String feedId, String content, String nickname, String thumbnail) async {
    try {
      Comment? newComment = await commentService.postComment(
          feedId, content, nickname, thumbnail);
      if (newComment != null) {
        comments.add(CommentWithFeedId(comment: newComment, feedId: feedId));
        update(); // 새 댓글 추가 후 UI 업데이트
        Get.snackbar('성공', '댓글이 성공적으로 추가되었습니다.');
      }
    } catch (e) {
      print('댓글 게시 에러: $e');
      Get.snackbar('오류', '댓글 게시에 실패했습니다.');
    }
  }

////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// 캘린더, 일정 부분 //////////////////////////////////////
  void addCalendarAppointment(Appointment appointment, String calendarId,
      String groupeventId, bool isSocial) {
    var newCalendarAppointment = CalendarAppointment(
        appointment: appointment,
        calendarId: calendarId,
        groupeventId: groupeventId,
        isSocial: isSocial);
    calendarAppointments.add(newCalendarAppointment);
    update();
  }

  void syncSocialEvents(List<dynamic> jsonData) {
    tz.initializeTimeZones(); // 시간대 데이터 초기화
    var seoul = tz.getLocation('Asia/Seoul'); // 서울 시간대 객체 가져오기
    // calendarAppointments에서 isSocial이 true인 항목 제거
    calendarAppointments.removeWhere((appointment) => appointment.isSocial);

    List<SocialEvent> events =
        jsonData.map((data) => SocialEvent.fromJson(data)).toList();

    Set<String> newEventCalendarIds =
        events.map((event) => event.userCalendarId).toSet();

    calendarAppointments.removeWhere(
        (appointment) => newEventCalendarIds.contains(appointment.calendarId));

    update();

    for (var event in events) {
      // UTC 시간을 서울 시간대로 변환
      DateTime startTimeSeoul = tz.TZDateTime.from(event.startAt, seoul);
      DateTime endTimeSeoul = tz.TZDateTime.from(event.endAt, seoul);
      addCalendarAppointment(
        Appointment(
          startTime: startTimeSeoul,
          endTime: endTimeSeoul,
          subject: event.title ?? 'KaKao',
          color: Colors.yellow,
          isAllDay: false,
        ),
        event.userCalendarId,
        event.socialEventId,
        true,
      );
    }
  }

  List<Appointment> getAppointmentsForCalendar(String calendarId) {
    return calendarAppointments
        .where((calendarAppointment) =>
            calendarAppointment.calendarId == calendarId)
        .map((calendarAppointment) => calendarAppointment.appointment)
        .toList();
  }

  List<Appointment> getAllAppointments() {
    return calendarAppointments.map((c) => c.appointment).toList();
  }

  List<CalendarAppointment> getAppointmentsForCalendarAndDate(
      String calendarId, DateTime date) {
    return calendarAppointments
        .where((appointment) =>
            appointment.calendarId == calendarId &&
            appointment.appointment.startTime.day == date.day &&
            appointment.appointment.startTime.month == date.month &&
            appointment.appointment.startTime.year == date.year)
        .toList();
  }

  // 특정 날짜에 해당하는 모든 일정을 가져오는 메소드
  List<CalendarAppointment> getAppointmentsForDate(DateTime date) {
    return calendarAppointments.where((calendarAppointment) {
      return calendarAppointment.appointment.startTime.day == date.day &&
          calendarAppointment.appointment.startTime.month == date.month &&
          calendarAppointment.appointment.startTime.year == date.year;
    }).toList();
  }

  // 일정과 연관된 피드들을 모두 삭제하는 기능이 포함된 일정 삭제 메소드
  Future<void> deleteCalendarAppointment(String groupEventId) async {
    bool isDeleted = await deleteEventService.deleteEvent(groupEventId);
    if (isDeleted) {
      int index = calendarAppointments
          .indexWhere((item) => item.groupeventId == groupEventId);
      if (index != -1) {
        calendarAppointments.removeAt(index);
        await deleteFeedsForEvent(groupEventId); // 연관된 피드들도 삭제
        update(); // UI 갱신
        Get.back(); // 현재 페이지 닫기
        Get.snackbar(
            'Success', 'Event and related feeds deleted successfully.');
      }
    } else {
      Get.snackbar('Error', 'Failed to delete event from server.',
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  // 캘린더와 해당 일정들을 삭제하는 메서드
  Future<void> deleteCalendarAndAppointments(String calendarId) async {
    bool isDeleted = await deleteCalendarService.deleteCalendar(calendarId);
    if (isDeleted) {
      Get.find<UserCalendarController>().removeCalendar(calendarId);
      // 로컬 상태에서 해당 캘린더의 일정들을 제거
      calendarAppointments
          .removeWhere((appointment) => appointment.calendarId == calendarId);
      update(); // UI 갱신
      Get.back(); // 현재 페이지 닫기
      Get.snackbar(
          'Success', 'Calendar and its appointments deleted successfully.');
    } else {
      Get.snackbar('Error', 'Failed to delete calendar and its appointments.');
    }
  }

  // 일정 데이터를 초기화하는 메소드
  void clearAppointments() {
    calendarAppointments.clear();
    update(); // UI 갱신을 위해 GetX 상태를 업데이트합니다.
  }

  void showAppointmentsModal(String calendarId, DateTime date) {
    var appointments = getAppointmentsForCalendarAndDate(calendarId, date);
    showModalBottomSheet(
      context: Get.context!,
      isScrollControlled: true,
      useSafeArea: true,
      isDismissible: true,
      builder: (BuildContext context) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              width: double.infinity,
              child: Text(
                DateFormat('M월 d일 EEEE', 'ko_KR').format(date),
                style: const TextStyle(color: Colors.black, fontSize: 18),
                textAlign: TextAlign.left,
              ),
            ),
            Expanded(
              child: appointments.isEmpty
                  ? const Center(
                      child: Text(
                        "일정이 없습니다",
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                  : Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 8),
                      child: ListView.builder(
                        itemCount: appointments.length,
                        itemBuilder: (context, index) {
                          var appointment = appointments[index];
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: InkWell(
                              onTap: () {
                                // 이벤트 상세 페이지로 네비게이션
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => EventDetailPage(
                                      eventTitle:
                                          appointment.appointment.subject,
                                      startTime:
                                          appointment.appointment.startTime,
                                      endTime: appointment.appointment.endTime,
                                      isNotified:
                                          false, // 예시 값, 실제 모델에 따라 수정 필요
                                      calendarColor:
                                          appointment.appointment.color,
                                      userProfileImageUrl:
                                          "https://cdn.pixabay.com/photo/2020/05/17/20/21/cat-5183427_640.jpg",
                                      groupEventId: appointment.groupeventId,
                                    ),
                                  ),
                                );
                              },
                              child: Row(
                                children: <Widget>[
                                  Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: <Widget>[
                                      Text(
                                        DateFormat('a h:mm', 'ko_KR').format(
                                            appointment.appointment.startTime),
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                      Text(
                                        DateFormat('a h:mm', 'ko_KR').format(
                                            appointment.appointment.endTime),
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    height: 30,
                                    width: 10,
                                    decoration: BoxDecoration(
                                      color: appointment.appointment.color,
                                      borderRadius: BorderRadius.circular(5),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      appointment.appointment.subject,
                                      style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const CircleAvatar(
                                    backgroundImage: NetworkImage(
                                        "https://cdn.pixabay.com/photo/2020/05/17/20/21/cat-5183427_640.jpg" // 유저 프로필 이미지 URL
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }
}
