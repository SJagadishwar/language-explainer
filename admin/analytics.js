fetch("/analytics/summary")
  .then(res => res.json())
  .then(data => {
    document.getElementById("sessions").innerText = data.totalSessions;
    const adoption =
      typeof data.adoptionRate === "number"
        ? data.adoptionRate
        : typeof data.usageRate === "number"
        ? data.usageRate
        : 0;

    document.getElementById("usage").innerText = adoption + "%";

    document.getElementById("returned").innerText = data.returnedToOriginal;

    document.getElementById("hinglish").innerText = data.languages.hinglish;
    document.getElementById("telgish").innerText = data.languages.telgish;
    document.getElementById("intensity").innerText =
      typeof data.engagementIntensity === "number"
        ? data.engagementIntensity
        : 0;



    document.getElementById("before").innerText = data.avgTimeBefore;
    document.getElementById("after").innerText = data.avgTimeAfter;
    document.getElementById("extra").innerText = data.avgExtraTime;
  })
  .catch(() => {
    alert("Failed to load analytics");
  });
