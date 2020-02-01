let transactions = [];
let myChart;
import { saveRecord } from "./db";

const categoryFilterEl = document.getElementById("f-category");
categoryFilterEl[0].selectedIndex = 0;

categoryFilterEl.addEventListener("change", function (event) {
  event.preventDefault();
  let currCategory = this.value;
  populateTable(currCategory);
  populateChart(currCategory);
});

fetch("/api/transaction")
  .then(response => response.json())
  .then(data => {
    // save db data on global variable
    transactions = data;
    populateTotal();
    populateTable("all");
    populateChart("all");
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  const total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  const totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable(category) {
  const tbody = document.querySelector("#tbody");
  const total = document.querySelector("#tfoottotal");
  tbody.innerHTML = "";
  total.innerHTML = "";
  if (category === "all") {
    transactions.forEach(transaction => {
      // create and populate a table row
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${transaction.date.substring(0, 19)}</td> 
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
      <td>${transaction.category}</td>
    `;
      tbody.appendChild(tr);
    });
    const sum = transactions.reduce((total, t) => {
      return total + parseInt(t.value);
    }, 0);
    total.textContent = sum;
  } else {
    let filteredTransactions = transactions.filter(transaction => transaction.category === category);
    filteredTransactions.forEach(transaction => {
      // create and populate a table row
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${transaction.date.substring(0, 19)}</td> 
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
      <td>${transaction.category}</td>
    `;
      tbody.appendChild(tr);
    });
    const sum = filteredTransactions.reduce((total, t) => {
      return total + parseInt(t.value);
    }, 0);
    total.textContent = sum;
  }
}

function populateChart(category) {
  let reversed =[];
  let sum =0;
  if (category === "all") {
    // copy array and reverse it
    reversed = transactions.slice().reverse();
    sum = 0;
  } else {
    let filteredTransactions = transactions.filter(transaction => transaction.category === category);
    reversed = filteredTransactions.reverse();
    sum = 0;
  }

  // create date labels for chart
  const labels = reversed.map(t => {
    const date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  const data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  const ctx = document.getElementById("my-chart").getContext("2d");

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total Over Time",
          fill: true,
          backgroundColor: "#6666ff",
          data
        }
      ]
    }
  });
}

function sendTransaction(isAdding) {
  const nameEl = document.querySelector("#t-name");
  const amountEl = document.querySelector("#t-amount");
  const categoryEl = document.querySelector("#t-category");
  const errorEl = document.querySelector("form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  } else {
    errorEl.textContent = "";
  }

  // create record
  const transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString(),
    category: categoryEl.value
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart("all");
  populateTable("all");
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      } else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
        categoryEl[0].selectedIndex = 0;
      }
    })
    .catch(err => {
      // fetch failed, so save in indexed db
      saveRecord(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
      categoryEl[0].selectedIndex = 0;
    });
}

document.querySelector("#add-btn").addEventListener("click", function (event) {
  event.preventDefault();
  sendTransaction(true);
});

document.querySelector("#sub-btn").addEventListener("click", function (event) {
  event.preventDefault();
  sendTransaction(false);
});
