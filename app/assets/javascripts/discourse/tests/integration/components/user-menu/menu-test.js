import componentTest, {
  setupRenderingTest,
} from "discourse/tests/helpers/component-test";
import {
  discourseModule,
  exists,
  query,
  queryAll,
} from "discourse/tests/helpers/qunit-helpers";
import { click, settled } from "@ember/test-helpers";
import { NOTIFICATION_TYPES } from "discourse/tests/fixtures/concerns/notification-types";
import { LIKE_NOTIFICATION_FREQUENCY_TYPE } from "discourse/models/user";
import hbs from "htmlbars-inline-precompile";
import pretender from "discourse/tests/helpers/create-pretender";

discourseModule("Integration | Component | user-menu", function (hooks) {
  setupRenderingTest(hooks);

  const template = hbs`<UserMenu::Menu/>`;

  componentTest("default tab is all notifications", {
    template,

    async test(assert) {
      const activeTab = query(".top-tabs.tabs-list .btn.active");
      assert.strictEqual(activeTab.id, "user-menu-button-all-notifications");
      const notifications = queryAll("#quick-access-all-notifications ul li");
      assert.strictEqual(notifications[0].className, "edited");
      assert.strictEqual(notifications[1].className, "replied");
      assert.strictEqual(notifications[2].className, "liked-consolidated");
    },
  });

  componentTest("notifications panel has a11y attributes", {
    template,

    async test(assert) {
      const panel = query("#quick-access-all-notifications");
      assert.strictEqual(panel.getAttribute("tabindex"), "-1");
      assert.strictEqual(
        panel.getAttribute("aria-labelledby"),
        "user-menu-button-all-notifications"
      );
    },
  });

  componentTest("active tab has a11y attributes that indicate it's active", {
    template,

    async test(assert) {
      const activeTab = query(".top-tabs.tabs-list .btn.active");
      assert.strictEqual(activeTab.getAttribute("tabindex"), "0");
      assert.strictEqual(activeTab.getAttribute("aria-selected"), "true");
    },
  });

  componentTest(
    "inactive tab has a11y attributes that indicate it's inactive",
    {
      template,

      async test(assert) {
        const inactiveTab = query(".top-tabs.tabs-list .btn:not(.active)");
        assert.strictEqual(inactiveTab.getAttribute("tabindex"), "-1");
        assert.strictEqual(inactiveTab.getAttribute("aria-selected"), "false");
      },
    }
  );

  componentTest("core top tabs", {
    template,

    async test(assert) {
      const tabs = queryAll(".top-tabs.tabs-list .btn");
      assert.strictEqual(tabs.length, 7);
      [
        "all-notifications",
        "replies",
        "mentions",
        "likes",
        "pms",
        "bookmarks",
        "badges",
      ].forEach((tab, index) => {
        assert.strictEqual(tabs[index].id, `user-menu-button-${tab}`);
        assert.strictEqual(
          tabs[index].getAttribute("data-tab-number"),
          index.toString()
        );
        assert.strictEqual(
          tabs[index].getAttribute("aria-controls"),
          `quick-access-${tab}`
        );
      });
    },
  });

  componentTest("core bottom tabs", {
    template,

    async test(assert) {
      const tabs = queryAll(".bottom-tabs.tabs-list .btn");
      assert.strictEqual(tabs.length, 1);
      const preferencesTab = tabs[0];
      assert.ok(preferencesTab.href.endsWith("/u/eviltrout/preferences"));
      assert.strictEqual(preferencesTab.getAttribute("data-tab-number"), "7");
      assert.strictEqual(preferencesTab.getAttribute("tabindex"), "-1");
    },
  });

  componentTest(
    "likes tab is hidden if currentUser's like notifications frequency is 'never'",
    {
      template,

      beforeEach() {
        this.currentUser.set(
          "like_notification_frequency",
          LIKE_NOTIFICATION_FREQUENCY_TYPE.never
        );
      },

      async test(assert) {
        assert.ok(!exists("#user-menu-button-likes"));

        const tabs = Array.from(queryAll(".tabs-list .btn")); // top and bottom tabs
        assert.strictEqual(tabs.length, 7);

        assert.deepEqual(
          tabs.map((t) => t.getAttribute("data-tab-number")),
          [...Array(7).keys()].map((n) => n.toString()),
          "data-tab-number of the tabs has no gaps when the likes tab is hidden"
        );
      },
    }
  );

  componentTest("reviewables tab is shown if currentUser can review", {
    template,

    beforeEach() {
      this.currentUser.set("can_review", true);
    },

    async test(assert) {
      const tab = query("#user-menu-button-review-queue");
      assert.strictEqual(tab.getAttribute("data-tab-number"), "7");

      const tabs = Array.from(queryAll(".tabs-list .btn")); // top and bottom tabs
      assert.strictEqual(tabs.length, 9);

      assert.deepEqual(
        tabs.map((t) => t.getAttribute("data-tab-number")),
        [...Array(9).keys()].map((n) => n.toString()),
        "data-tab-number of the tabs has no gaps when the reviewables tab is show"
      );
    },
  });

  componentTest("reviewables count is shown on the reviewables tab", {
    template,

    beforeEach() {
      this.currentUser.set("can_review", true);
      this.currentUser.set("reviewable_count", 4);
    },

    async test(assert) {
      const countBadge = query(
        "#user-menu-button-review-queue .badge-notification"
      );
      assert.strictEqual(countBadge.textContent, "4");

      this.currentUser.set("reviewable_count", 0);
      await settled();

      assert.ok(!exists("#user-menu-button-review-queue .badge-notification"));
    },
  });

  componentTest("private_message notifications count is shown on the PMs tab", {
    template,

    beforeEach() {
      this.currentUser.set("grouped_unread_high_priority_notifications", {
        [NOTIFICATION_TYPES.private_message]: 3,
      });
    },

    async test(assert) {
      let countBadge = query("#user-menu-button-pms .badge-notification");
      assert.strictEqual(countBadge.textContent, "3");

      this.currentUser.set("grouped_unread_high_priority_notifications", {
        [NOTIFICATION_TYPES.private_message]: 8,
      });
      await settled();

      countBadge = query("#user-menu-button-pms .badge-notification");
      assert.strictEqual(countBadge.textContent, "8");

      this.currentUser.set("grouped_unread_high_priority_notifications", {});
      await settled();

      assert.ok(!exists("#user-menu-button-pms .badge-notification"));
    },
  });

  componentTest(
    "bookmark_reminder notifications count is shown on the bookmarks tab",
    {
      template,

      beforeEach() {
        this.currentUser.set("grouped_unread_high_priority_notifications", {
          [NOTIFICATION_TYPES.bookmark_reminder]: 2,
        });
      },

      async test(assert) {
        let countBadge = query(
          "#user-menu-button-bookmarks .badge-notification"
        );
        assert.strictEqual(countBadge.textContent, "2");

        this.currentUser.set("grouped_unread_high_priority_notifications", {
          [NOTIFICATION_TYPES.bookmark_reminder]: 9,
        });
        await settled();

        countBadge = query("#user-menu-button-bookmarks .badge-notification");
        assert.strictEqual(countBadge.textContent, "9");

        this.currentUser.set("grouped_unread_high_priority_notifications", {});
        await settled();

        assert.ok(!exists("#user-menu-button-bookmarks .badge-notification"));
      },
    }
  );

  componentTest("changing tabs", {
    template,

    beforeEach() {
      this.currentUser.set("can_review", true);
    },

    async test(assert) {
      let queryParams;
      pretender.get("/notifications", (request) => {
        queryParams = request.queryParams;
        let data;
        if (queryParams.filter_by_types === "mentioned") {
          data = [
            {
              id: 6,
              user_id: 1,
              notification_type: NOTIFICATION_TYPES.mentioned,
              read: true,
              high_priority: false,
              created_at: "2021-11-25T19:31:13.241Z",
              post_number: 6,
              topic_id: 10,
              fancy_title: "Greetings!",
              slug: "greetings",
              data: {
                topic_title: "Greetings!",
                original_post_id: 20,
                original_post_type: 1,
                original_username: "discobot",
                revision_number: null,
                display_username: "discobot",
              },
            },
          ];
        } else if (queryParams.filter_by_types === "bookmark_reminder") {
          data = [
            {
              id: 42,
              user_id: 1,
              notification_type: NOTIFICATION_TYPES.bookmark_reminder,
              read: true,
              high_priority: false,
              created_at: "2021-11-25T19:31:13.241Z",
              post_number: 6,
              topic_id: 10,
              fancy_title: "Greetings!",
              slug: "greetings",
              data: {
                topic_title: "Greetings!",
                original_post_id: 20,
                original_post_type: 1,
                original_username: "discobot",
                revision_number: null,
                display_username: "discobot",
              },
            },
            {
              id: 73,
              user_id: 1,
              notification_type: NOTIFICATION_TYPES.bookmark_reminder,
              read: false,
              high_priority: true,
              created_at: "2021-11-25T19:31:13.241Z",
              post_number: 6,
              topic_id: 10,
              fancy_title: "Greetings 123!",
              slug: "greetings 123",
              data: {
                topic_title: "Greetings 123!",
                original_post_id: 20,
                original_post_type: 1,
                original_username: "discobot",
                revision_number: null,
                display_username: "discobot",
              },
            },
          ];
        } else if (queryParams.filter_by_types === "liked,liked_consolidated") {
          data = [
            {
              id: 60,
              user_id: 1,
              notification_type: NOTIFICATION_TYPES.liked,
              read: true,
              high_priority: false,
              created_at: "2021-11-25T19:31:13.241Z",
              post_number: 6,
              topic_id: 10,
              fancy_title: "Greetings!",
              slug: "greetings",
              data: {
                topic_title: "Greetings!",
                original_post_id: 20,
                original_post_type: 1,
                original_username: "discobot",
                revision_number: null,
                display_username: "discobot",
              },
            },
            {
              id: 63,
              user_id: 1,
              notification_type: NOTIFICATION_TYPES.liked,
              read: true,
              high_priority: false,
              created_at: "2021-11-25T19:31:13.241Z",
              post_number: 6,
              topic_id: 10,
              fancy_title: "Greetings!",
              slug: "greetings",
              data: {
                topic_title: "Greetings!",
                original_post_id: 20,
                original_post_type: 1,
                original_username: "discobot",
                revision_number: null,
                display_username: "discobot",
              },
            },
            {
              id: 20,
              user_id: 1,
              notification_type: NOTIFICATION_TYPES.liked_consolidated,
              read: true,
              high_priority: false,
              created_at: "2021-11-25T19:31:13.241Z",
              post_number: 6,
              topic_id: 10,
              fancy_title: "Greetings 123!",
              slug: "greetings 123",
              data: {
                topic_title: "Greetings 123!",
                original_post_id: 20,
                original_post_type: 1,
                original_username: "discobot",
                revision_number: null,
                display_username: "discobot",
              },
            },
          ];
        } else {
          throw new Error(
            `unexpected notification type ${queryParams.filter_by_types}`
          );
        }

        return [
          200,
          { "Content-Type": "application/json" },
          { notifications: data },
        ];
      });

      await click("#user-menu-button-mentions");
      let panel = query(".quick-access-panel");
      assert.strictEqual(panel.id, "quick-access-mentions");
      assert.strictEqual(
        queryParams.filter_by_types,
        "mentioned",
        "request params has filter_by_types set to `mentioned`"
      );
      let activeTabs = queryAll(".top-tabs .btn.active");
      assert.strictEqual(activeTabs.length, 1);
      assert.strictEqual(
        activeTabs[0].id,
        "user-menu-button-mentions",
        "active tab is now the mentions tab"
      );
      let notifications = panel.querySelectorAll("ul li");
      assert.strictEqual(notifications.length, 1);

      await click("#user-menu-button-bookmarks");
      panel = query(".quick-access-panel");
      assert.strictEqual(panel.id, "quick-access-bookmarks");
      assert.strictEqual(
        queryParams.filter_by_types,
        "bookmark_reminder",
        "request params has filter_by_types set to `bookmark_reminder`"
      );
      activeTabs = queryAll(".top-tabs .btn.active");
      assert.strictEqual(activeTabs.length, 1);
      assert.strictEqual(
        activeTabs[0].id,
        "user-menu-button-bookmarks",
        "active tab is now the bookmark reminders tab"
      );
      notifications = panel.querySelectorAll("ul li");
      assert.strictEqual(notifications.length, 2);

      await click("#user-menu-button-likes");
      panel = query(".quick-access-panel");
      assert.strictEqual(panel.id, "quick-access-likes");
      assert.strictEqual(
        queryParams.filter_by_types,
        "liked,liked_consolidated",
        "request params has filter_by_types set to `liked` and `liked_consolidated"
      );
      activeTabs = queryAll(".top-tabs .btn.active");
      assert.strictEqual(activeTabs.length, 1);
      assert.strictEqual(
        activeTabs[0].id,
        "user-menu-button-likes",
        "active tab is now the likes tab"
      );
      notifications = panel.querySelectorAll("ul li");
      assert.strictEqual(notifications.length, 3);

      await click("#user-menu-button-review-queue");
      panel = query(".quick-access-panel");
      assert.strictEqual(panel.id, "quick-access-review-queue");
      activeTabs = queryAll(".top-tabs .btn.active");
      assert.strictEqual(activeTabs.length, 1);
      assert.strictEqual(
        activeTabs[0].id,
        "user-menu-button-review-queue",
        "active tab is now the reviewables tab"
      );
      const reviewables = panel.querySelectorAll("ul li");
      assert.strictEqual(reviewables.length, 8);
    },
  });
});
