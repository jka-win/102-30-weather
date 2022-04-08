
const owm = (() => {
    const owmEndpoint = "https://api.openweathermap.org/data/2.5";
    const owmKey = "6939073922af39303e48a31042083059";
    
    return (query, params) => {
        params = { ...params, appid: owmKey };
        const paramStr = Object.keys(params)
            .map(key => `${key}=${params[key]}`)
            .join("&");
        return `${owmEndpoint}/${query}?${paramStr}`;
    }
})();

async function logFetch(url) {
    try {
        console.log("->", url);
        const res = await fetch(url);
        console.log("<-", res);
        const body = await res.json();
        console.log("<-", body);
        return { res, body };
    } catch (e) {
        console.log(e);
        throw e;
    }
}

const doc = document;
const tempButtonC = doc.getElementById("temp-button-c");
const tempButtonF = doc.getElementById("temp-button-f");
const zipInput = doc.getElementById("zip-input");
const zipError = doc.getElementById("zip-error");

const cityName = doc.getElementById("city-name");
const timestamp = doc.getElementById("timestamp");

const tempCurrent = doc.getElementById("temp-current");
const tempHigh = doc.getElementById("temp-high");
const tempLow = doc.getElementById("temp-low");

const condIcon = doc.getElementById("cond-icon");
const condMain = doc.getElementById("cond-main");
const condDescription = doc.getElementById("cond-description");
const miniConds = doc.getElementsByClassName("cond-small");

let currentZip;
let currentUnit = "imperial";
function formatTemp(temp) {
    return `${temp.toFixed(0)}&deg;${currentUnit == "metric" ? "C" : "F"}`;
}

function displayWeather(weather, icon, main, desc) {
    icon.src = `http://openweathermap.org/img/wn/${weather.icon}@2x.png`;
    main.innerHTML = weather.main;
    desc.innerHTML = weather.description;
}

async function requestWeather(lat, lon) {
    const { res, body } = await logFetch(owm("onecall", {
        lat, lon,
        exclude: "minutely,hourly,alerts",
        units: currentUnit
    }));

    if (res.status == 200) {
        timestamp.innerHTML = new Date().toDateString();
        tempCurrent.innerHTML = formatTemp(body.current.temp);
        tempHigh.innerHTML = formatTemp(body.daily[0].temp.max);
        tempLow.innerHTML = formatTemp(body.daily[0].temp.min);
        displayWeather(body.current.weather[0], condIcon, condMain, condDescription);

        function displayMiniCond(cond, forecast) {
            const weather = forecast.weather[0];
            const date = new Date(forecast.dt * 1000);
            cond.querySelector(".cond-small-date").innerHTML = date.toLocaleString("en-US", {
                month: "short", day: "numeric"
            });
            cond.querySelector(".cond-small-icon").src = `http://openweathermap.org/img/wn/${weather.icon}@2x.png`;
            cond.querySelector(".cond-small-weather").innerHTML = weather.main;
            cond.querySelector(".cond-small-high").innerHTML = formatTemp(forecast.temp.max);
            cond.querySelector(".cond-small-low").innerHTML = formatTemp(forecast.temp.min);
        }
        displayMiniCond(miniConds[0], body.daily[1]);
        displayMiniCond(miniConds[1], body.daily[2]);
        displayMiniCond(miniConds[2], body.daily[3]);
    } else {
        throw new Error(`${res.status} ${res.statusText}`);
    }
}

async function requestZip(zip) {
    zipError.innerText = "";
    try {
        const { res, body } = await logFetch(owm("weather", { zip }));
        if (res.status == 200) {
            cityName.innerText = body.name;
            await requestWeather(body.coord.lat, body.coord.lon);
            currentZip = zip;
        } else {
            throw new Error(`${res.status} ${res.statusText}`);
        }
    } catch (e) {
        zipError.innerText = e;
    };
}

zipInput.onkeyup = e => {
    if (e.key === "Enter") {
        requestZip(zipInput.value);
    }
};

function toggleTempButtons(buttonOn, buttonOff, unit) {
    buttonOn.disabled = true;
    buttonOff.disabled = false;
    currentUnit = unit;

    if (currentZip) {
        requestZip(currentZip);
    }
}

tempButtonC.onclick = e => {
    toggleTempButtons(tempButtonC, tempButtonF, "metric");
};

tempButtonF.onclick = e => {
    toggleTempButtons(tempButtonF, tempButtonC, "imperial");
};

//

requestZip(28205);
