import Component from "@ember/component";
import { getOwner } from "discourse-common/lib/get-owner";

export default Component.extend({
  actions: {
    toggleBulkSelect() {
      const controller = getOwner(this).lookup(
        `controller:${this.parentController}`
      );
      const selection = controller.get("selected");
      controller.toggleProperty("bulkSelectEnabled");
      selection.clear();
    },
  },
});
