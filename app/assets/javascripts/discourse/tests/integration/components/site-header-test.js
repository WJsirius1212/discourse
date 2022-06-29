import componentTest, {
  setupRenderingTest,
} from "discourse/tests/helpers/component-test";
import {
  count,
  discourseModule,
  exists,
  query,
} from "discourse/tests/helpers/qunit-helpers";
import pretender from "discourse/tests/helpers/create-pretender";
import hbs from "htmlbars-inline-precompile";
import { click, settled } from "@ember/test-helpers";

discourseModule("Integration | Component | site-header", function (hooks) {
  setupRenderingTest(hooks);

  componentTest("first notification mask", {
    template: hbs`{{site-header}}`,

    beforeEach() {
      this.set("currentUser.unread_high_priority_notifications", 1);
      this.set("currentUser.read_first_notification", false);
    },

    async test(assert) {
      assert.strictEqual(
        count(".ring-backdrop"),
        1,
        "there is the first notification mask"
      );

      // Click anywhere
      await click("header.d-header");

      assert.ok(
        !exists(".ring-backdrop"),
        "it hides the first notification mask"
      );
    },
  });

  componentTest("do not call authenticated endpoints as anonymous", {
    template: hbs`{{site-header}}`,
    anonymous: true,

    async test(assert) {
      assert.ok(
        !exists(".ring-backdrop"),
        "there is no first notification mask for anonymous users"
      );

      pretender.get("/notifications", () => {
        assert.ok(false, "it should not try to refresh notifications");
        return [403, { "Content-Type": "application/json" }, {}];
      });

      // Click anywhere
      await click("header.d-header");
    },
  });

  componentTest(
    "rerenders when all_unread_notifications or unseen_reviewable_count change",
    {
      template: hbs`{{site-header}}`,

      beforeEach() {
        this.siteSettings.enable_revamped_user_menu = true;
        this.currentUser.set("all_unread_notifications", 1);
      },

      async test(assert) {
        let unreadBadge = query(
          ".header-dropdown-toggle.current-user .unread-notifications"
        );
        assert.strictEqual(unreadBadge.textContent, "1");

        this.currentUser.set("all_unread_notifications", 5);
        await settled();

        unreadBadge = query(
          ".header-dropdown-toggle.current-user .unread-notifications"
        );
        assert.strictEqual(unreadBadge.textContent, "5");

        this.currentUser.set("unseen_reviewable_count", 3);
        await settled();

        unreadBadge = query(
          ".header-dropdown-toggle.current-user .unread-notifications"
        );
        assert.strictEqual(unreadBadge.textContent, "8");
      },
    }
  );

  componentTest(
    "user avatar is highlighted when the user receives the first notification",
    {
      template: hbs`{{site-header}}`,

      beforeEach() {
        this.siteSettings.enable_revamped_user_menu = true;
        this.currentUser.set("all_unread_notifications", 1);
        this.currentUser.set("read_first_notification", false);
        this.currentUser.set("enforcedSecondFactor", false);
      },

      test(assert) {
        assert.ok(exists(".ring-first-notification"));
      },
    }
  );

  componentTest(
    "user avatar is highlighted when the user receives notifications beyond the first one",
    {
      template: hbs`{{site-header}}`,

      beforeEach() {
        this.siteSettings.enable_revamped_user_menu = true;
        this.currentUser.set("all_unread_notifications", 1);
        this.currentUser.set("read_first_notification", true);
        this.currentUser.set("enforcedSecondFactor", false);
      },

      test(assert) {
        assert.ok(!exists(".ring-first-notification"));
      },
    }
  );

  componentTest("hamburger menu icon shows pending reviewables count", {
    template: hbs`{{site-header}}`,

    beforeEach() {
      this.currentUser.set("reviewable_count", 1);
    },

    test(assert) {
      let pendingReviewablesBadge = query(
        ".hamburger-dropdown .badge-notification"
      );
      assert.strictEqual(pendingReviewablesBadge.textContent, "1");
    },
  });

  componentTest(
    "hamburger menu icon doesn't show pending reviewables count when revamped user menu is enabled",
    {
      template: hbs`{{site-header}}`,

      beforeEach() {
        this.siteSettings.enable_revamped_user_menu = true;
        this.currentUser.set("reviewable_count", 1);
      },

      test(assert) {
        assert.ok(!exists(".hamburger-dropdown .badge-notification"));
      },
    }
  );

  componentTest("clicking outside the revamped user menu closes the menu", {
    template: hbs`{{site-header}}`,

    beforeEach() {
      this.siteSettings.enable_revamped_user_menu = true;
    },

    async test(assert) {
      await click(".header-dropdown-toggle.current-user");
      assert.ok(exists(".user-menu.menu-panel.revamped"));

      await click(".d-header-wrap");
      assert.ok(!exists(".user-menu.menu-panel.revamped"));
    },
  });
});
