"use strict";

import "./popup.css";

(function() {
  // We will make use of Storage API to get and store `count` value
  // More information on Storage API can we found at
  // https://developer.chrome.com/extensions/storage

  // To get storage access, we have to mention it in `permissions` property of manifest.json file
  // More information on Permissions can we found at
  // https://developer.chrome.com/extensions/declare_permissions

  function PreferencesForm() {
    var form = document.querySelector("form");
    const button = form.querySelector("button");
    const litres = form.querySelector('[name="litres"]');
    const reminders = form.querySelector('[name="reminders"]');

    chrome.storage.sync.get(["preferences"], function(result) {
      let preferences = result.preferences || { litres: 2.2, reminders: 30 };
      litres.value = preferences.litres;
      reminders.value = preferences.reminders;
    });

    function animateBtnSaving() {
      button.innerText = "Saving...";
      button.disabled = true;

      setTimeout(() => {
        button.innerText = "Save";
        button.disabled = false;
      }, 1000);
    }

    function saveValues(cb) {
      chrome.storage.sync.set(
        {
          preferences: {
            litres: Number(litres.value),
            reminders: Number(reminders.value)
          }
        },
        cb
      );
    }

    form.addEventListener("submit", function(e) {
      e.preventDefault();
      saveValues(() => {
        animateBtnSaving();
        chrome.runtime.sendMessage({ type: "state" });
      });
    });
  }

  function Water() {
    function getDayMonthYear(date = new Date()) {
      return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
    }

    function render() {
      chrome.storage.sync.get(["timeline", "preferences"], function(result) {
        let preferences = result.preferences || { litres: 2.2, reminders: 30 };
        const today = getDayMonthYear();
        const timeline =
          result.timeline && Array.isArray(result.timeline[today])
            ? result.timeline[today]
            : [];
        const percent =
          (timeline.reduce((total, next) => total + next, 0) /
            1000 /
            preferences.litres) *
          100;

        document.querySelector(".glass__total").innerText = `${timeline.reduce(
          (total, next) => total + next,
          0
        ) / 1000} L`;

        document.querySelector(".glass__water").style.height = `${Math.max(
          15,
          100 - percent
        )}%`;
      });
    }

    chrome.runtime.onMessage.addListener(function(request) {
      if (request.type === "water") {
        render();
      }
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", function() {
    PreferencesForm();
    Water();
  });
})();
