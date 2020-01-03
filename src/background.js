"use strict";

function getDayMonthYear(date = new Date()) {
  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
}

function Notifications() {
  var alarmName = "remindme";

  function checkAlarm(callback) {
    console.log("check alarms");
    chrome.alarms.getAll(function(alarms) {
      var hasAlarm = alarms.some(function(a) {
        return a.name == alarmName;
      });
      callback(hasAlarm);
    });
  }

  function setAlarm() {
    chrome.storage.sync.get(["preferences"], function(result) {
      let preferences = result.preferences || { litres: 2.2, reminders: 30 };
      console.log(`Alarm set every ${preferences.reminders} minutes`);
      chrome.alarms.create(alarmName, {
        delayInMinutes: preferences.reminders,
        periodInMinutes: preferences.reminders
      });
    });
  }

  function cancelAlarm() {
    chrome.alarms.clear(alarmName);
  }

  function toggleAlarm() {
    checkAlarm(function(hasAlarm) {
      if (hasAlarm) {
        cancelAlarm();
        setAlarm();
      } else {
        setAlarm();
      }
    });
  }

  return {
    toggle: toggleAlarm
  };
}

function showDrinkNotification() {
  chrome.notifications.create(
    undefined,
    {
      type: "basic",
      iconUrl: "icons/icon_144.png",
      title: "Drink Water!",
      message: "Drink a glass of water to stay hydrated and focused",
      buttons: [
        {
          title: "Skip"
        },
        {
          title: "Drink"
        }
      ]
    },
    function() {}
  );
}

function addCup(cb) {
  chrome.storage.sync.get(["timeline"], function(result) {
    const today = getDayMonthYear();
    const timeline = result.timeline || {};
    const drinksToday = timeline[today] || [];
    drinksToday.push(240);
    chrome.storage.sync.set(
      {
        timeline: {
          ...timeline,
          [today]: drinksToday
        }
      },
      function() {
        console.log("Drunk!");
        cb();
      }
    );
  });
}

Notifications().toggle();

chrome.runtime.onMessage.addListener(function(request) {
  if (request.type === "state") {
    Notifications().toggle();
  }
});

chrome.alarms.onAlarm.addListener(showDrinkNotification);

chrome.notifications.onButtonClicked.addListener(function(id, btnIndex) {
  if (btnIndex === 1) {
    addCup(function() {
      chrome.notifications.clear(id);
      chrome.runtime.sendMessage({ type: "drunk" });
    });
  } else {
    chrome.notifications.clear(id);
  }
});