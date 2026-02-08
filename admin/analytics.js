fetch("/analytics/summary")
  .then(res => res.json())
  .then(data => {
    document.getElementById("sessions").innerText = data.totalSessions;
    document.getElementById("usage").innerText = data.usageRate + "%";
    document.getElementById("returned").innerText = data.returnedToOriginal;

    document.getElementById("hinglish").innerText = data.languages.hinglish;
    document.getElementById("telgish").innerText = data.languages.telgish;

    document.getElementById("before").innerText = data.avgTimeBefore;
    document.getElementById("after").innerText = data.avgTimeAfter;
    document.getElementById("extra").innerText = data.avgExtraTime;
  })
  .catch(() => {
    alert("Failed to load analytics");
  });
