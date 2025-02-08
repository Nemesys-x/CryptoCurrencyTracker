// script.js
document.addEventListener("DOMContentLoaded", function () {
  // Portfolio-Daten (als Array)
  var portfolio = [];
  // Preise werden als Objekt gespeichert (z.B. { bitcoin: 12345.67, dogecoin: 0.06 })
  var prices = {};

  // Chart-Instanz (wird später initialisiert)
  var portfolioChart;

  // Funktion, um die aktuellen Preise von CoinGecko zu laden
  async function fetchPrices() {
    try {
      var response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 250,
          page: 1,
          sparkline: false
        }
      });

      // Preise in ein Objekt umwandeln: { coinId: current_price, ... }
      prices = response.data.reduce(function (acc, coin) {
        acc[coin.id] = coin.current_price;
        return acc;
      }, {});

      updateTable();
      updateChart();
    } catch (error) {
      console.error("Error fetching crypto prices", error);
    }
  }

  // Funktion, um die Portfolio-Tabelle zu aktualisieren
  function updateTable() {
    var tbody = document.querySelector("#portfolioTable tbody");
    tbody.innerHTML = ""; // Vorherige Einträge löschen

    portfolio.forEach(function (item) {
      var tr = document.createElement("tr");

      var tdCoin = document.createElement("td");
      tdCoin.textContent = item.crypto;
      tr.appendChild(tdCoin);

      var tdAmount = document.createElement("td");
      tdAmount.textContent = item.amount;
      tr.appendChild(tdAmount);

      var tdValue = document.createElement("td");
      // Aktuellen Preis abrufen (wenn nicht vorhanden, wird 0 verwendet)
      var currentPrice = prices[item.crypto] || 0;
      tdValue.textContent = "$" + (item.amount * currentPrice).toFixed(2);
      tr.appendChild(tdValue);

      tbody.appendChild(tr);
    });
  }

  // Initialisierung des Diagramms
  function initChart() {
    var ctx = document.getElementById("portfolioChart").getContext("2d");
    portfolioChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Portfolio Value (USD)',
          data: [],
          fill: false,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Zeit'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Wert in USD'
            }
          }
        }
      }
    });
  }

  // Funktion, um den aktuellen Portfolio-Wert zu berechnen und dem Diagramm hinzuzufügen
  function updateChart() {
    if (!portfolioChart) return; // Chart noch nicht initialisiert

    // Gesamtwert des Portfolios berechnen
    var totalValue = portfolio.reduce(function(sum, item) {
      var coinValue = prices[item.crypto] || 0;
      return sum + item.amount * coinValue;
    }, 0);

    // Aktueller Zeitstempel als Label
    var now = new Date();
    var timeLabel = now.toLocaleTimeString();

    portfolioChart.data.labels.push(timeLabel);
    portfolioChart.data.datasets[0].data.push(totalValue);

    // Begrenze die Anzahl der Datenpunkte (z. B. auf die letzten 20)
    if (portfolioChart.data.labels.length > 20) {
      portfolioChart.data.labels.shift();
      portfolioChart.data.datasets[0].data.shift();
    }

    portfolioChart.update();
  }

  // Event-Listener für den "Hinzufügen"-Button
  document.getElementById("addButton").addEventListener("click", function () {
    var cryptoInput = document.getElementById("cryptoInput");
    var amountInput = document.getElementById("amountInput");

    // Eingaben abrufen und verarbeiten
    var crypto = cryptoInput.value.trim().toLowerCase();
    var amount = parseFloat(amountInput.value);

    // Überprüfen, ob Eingaben gültig sind
    if (!crypto || !amount || isNaN(amount) || amount <= 0) {
      return;
    }

    // Überprüfen, ob der Coin in den geladenen Preisen vorhanden ist
    if (!prices[crypto]) {
      alert("Der Coin " + crypto + " ist nicht verfügbar. Bitte überprüfe den Namen.");
      return;
    }

    // Neuen Eintrag zum Portfolio hinzufügen
    portfolio.push({ crypto: crypto, amount: amount });

    // Eingabefelder leeren
    cryptoInput.value = "";
    amountInput.value = "";

    updateTable();
    updateChart();
  });

  // Initialisierung des Diagramms
  initChart();

  // Initiale Preise laden und Diagramm aktualisieren
  fetchPrices();

  // Alle 60 Sekunden (60000ms) die Preise aktualisieren
  setInterval(fetchPrices, 60000);
});
