fetch(window.location.origin + "/analytics/summary")
  .then(res => {
    if (!res.ok) {
      throw new Error("Analytics API error: " + res.status);
    }
    return res.json();
  })
  .then(data => {
    document.getElementById("sessions").innerText =
      data.totalSessions ?? "–";

    const adoption =
      typeof data.adoptionRate === "number"
        ? data.adoptionRate
        : typeof data.usageRate === "number"
        ? data.usageRate
        : 0;

    document.getElementById("usage").innerText = adoption + "%";
    document.getElementById("returned").innerText =
      data.returnedToOriginal ?? "–";

    document.getElementById("hinglish").innerText =
      data.languages?.hinglish ?? 0;

    document.getElementById("telgish").innerText =
      data.languages?.telgish ?? 0;

    document.getElementById("intensity").innerText =
      typeof data.engagementIntensity === "number"
        ? data.engagementIntensity
        : 0;

    document.getElementById("before").innerText =
      typeof data.avgTimeBefore === "number"
        ? data.avgTimeBefore + " sec"
        : "– sec";

    document.getElementById("after").innerText =
      typeof data.avgTimeAfter === "number"
        ? data.avgTimeAfter + " sec"
        : "– sec";

    document.getElementById("extra").innerText =
      typeof data.avgExtraTime === "number"
        ? data.avgExtraTime + " sec"
        : "– sec";
  })
  .catch(err => {
    console.warn("Analytics fetch failed safely:", err.message);
  });
