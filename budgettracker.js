Players = new Mongo.Collection("players");
Categories = new Mongo.Collection("categories");
Transactions = new Mongo.Collection("transactions");

if (Meteor.isClient) {
  /**
   * Month Selector Helpers
   */
  Template.monthselection.helpers({
    getCurrentMonth: function () {
      var monthStartDate = getSelectedMonthStartDate();
      var month = monthStartDate.getMonth() + 1;
      month = month < 10 ? '0' + month : '' + month;
      return monthStartDate.getFullYear() + "-" + month;
    }
  });
  Template.monthselection.events({
    'change .month-select': function () {
      var date = new Date(event.target.value + "-01 PDT");
      console.log("Selected Date: " + date);
      Session.set("selectedMonth", date);
    }
  });

  /**
   * Transactions List Helpers
   */
  Template.transactionslist.helpers({
    transactions: function () {
      var monthStartDate = getSelectedMonthStartDate();
      var firstDay = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth(), 1);
      var lastDay = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 1);
      if (Session.get('txnSortField') == null) {
        Session.set('txnSortField', {date: -1});
      }
      return Transactions.find(
          {
            date: {
              $gte: firstDay,
              $lt: lastDay
            }
          }, {sort: Session.get('txnSortField')});
    },
    getAmount: function () {
      return Math.abs(this.amount).toFixed(2);
    },
    categories: function () {
      return Categories.find();
    },
    getFormattedDate: function () {
      return this.date.getMonth() + 1 + "/" + this.date.getDate() + "/" + this.date.getFullYear();
    },
    isAddingTransaction: function () {
      return Session.get("adding_transaction");
    },
    isWithdrawal: function () {
      if (Session.get("adding_transaction_withdrawal") == null) {
        return true;
      }
      else {
        return Session.get("adding_transaction_withdrawal");
      }
    },
    getTodaysDateFormatted: function () {
      var today = new Date();
      //today = new Date(today.getTime() + (3600000*offset));

      var month = today.getMonth() + 1;
      month = month < 10 ? '0' + month : '' + month;
      var day = today.getDate() + 1;
      day = day < 10 ? '0' + day : '' + day;
      var dateFormatted = today.getFullYear() + "-" + month + "-" + day;
      //console.log("OKOKKO" + dateFormatted);
      return dateFormatted;
    }
  });
  Template.transactionslist.events(
      {
        'click div.add-transaction': function () {
          event.preventDefault();
          if (Session.get("adding_transaction")) {
            Session.set("adding_transaction", false);
          }
          else {
            Session.set("adding_transaction", true);
          }
        },
        'submit form.add-transaction': function () {
          // Prevent default browser form submit
          event.preventDefault();
          var amount = event.target.amount.value;
          var dateString = event.target.date.value + " PDT";
          var comments = event.target.comments.value;
          var type = event.target.type.value;
          var category;
          if (type == "deposit") {
            category = "Deposit";
          }
          else {
            category = event.target.category.value;
          }
          //
          //var date = new Date(dateString);
          //var today = new Date();
          //console.log("TODAY: " + today);
          //if (today.getFullYear() == date.getFullYear() && today.getMonth() == date.getMonth()
          //    && today.getDate() == date.getDate()) {
          //}

          Transactions.insert({
            category_id: category,
            amount: parseFloat(-amount),
            date: new Date(dateString),
            type: type,
            comments: comments
          });
          Session.set("adding_transaction", false);
        },
        'click select.transaction-type': function () {
          var name = event.target.value;
          if (name == "deposit") {
            Session.set("adding_transaction_withdrawal", false);
          } else {
            Session.set("adding_transaction_withdrawal", true);
          }
        },
        'click th.sort-categories': function () {
          var sortOrder = 1;
          if (Session.get('txnSortField') != null && Session.get('txnSortField').category_id != null) {
            sortOrder = Session.get('txnSortField').category_id * -1;
          }
          Session.set('txnSortField', {category_id: sortOrder, date: -1});
        },
        'click th.sort-dates': function () {
          var sortOrder = 1;
          if (Session.get('txnSortField') != null && Session.get('txnSortField').date != null) {
            sortOrder = Session.get('txnSortField').date * -1;
          }
          Session.set('txnSortField', {date: sortOrder});
        },
        'click th.sort-amounts': function () {
          var sortOrder = 1;
          if (Session.get('txnSortField') != null && Session.get('txnSortField').amount != null) {
            sortOrder = Session.get('txnSortField').amount * -1;
          }
          Session.set('txnSortField', {amount: sortOrder, date: -1});
        }
        //'click tr.transaction-row td': function () {
        //  var name = event.target.hidden();
        //  //var newText = $(this).val();
        //  //$(this).parent().text(newText).find('textarea').remove();
        //  console.log("OKOK1 " + name);
        //}
      }
  );

  /**
   * Categories List Helpers
   */
  Template.categorieslist.helpers({
    categories: function () {
      return Categories.find({}, {sort: {_id: 1}});
    },
    isAddingCategory: function () {
      return Session.get("adding_category");
    },
    getAmount: function () {
      return this.amount.toFixed(2);
    },
    getAmountUsedForThisMonth: function () {
      var monthStartDate = getSelectedMonthStartDate();
      return getAmountUsedForMonth(this, monthStartDate).toFixed(2);
    },
    getPercentUsed: function () {
      var monthStartDate = getSelectedMonthStartDate();
      var amountUsed = getAmountUsedForMonth(this, monthStartDate);
      var percentUsed = Math.round(amountUsed / this.amount * 100);
      //console.log("Percent Used: " + percentUsed);
      return percentUsed;
    },
    getProgressBarClass: function () {
      var monthStartDate = getSelectedMonthStartDate();
      var amountUsed = getAmountUsedForMonth(this, monthStartDate);
      var percentUsed = Math.round(amountUsed / this.amount * 100);
      if (percentUsed > 80) {
        return "progress-bar-danger";
      } else if (percentUsed > 50) {
        return "progress-bar-warning";
      }
      else {
        return "progress-bar-success";
      }
    }
  });
  Template.categorieslist.events(
      {
        'click div.add-category': function () {
          event.preventDefault();
          if (Session.get("adding_category")) {
            Session.set("adding_category", false);
          }
          else {
            Session.set("adding_category", true);
          }
        },
        'submit form.add-category': function () {
          // Prevent default browser form submit
          event.preventDefault();
          var name = event.target.name.value;
          var amount = event.target.amount.value;
          Categories.insert({_id: name, amount: parseFloat(amount)});
          Session.set("adding_category", false);
        }
      }
  );
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Transactions.find().count() === 0) {
      var transactions = JSON.parse(Assets.getText("transactions.json"));
      _.each(transactions, function (transaction) {
        Transactions.insert(
            {
              category_id: transaction.category_id,
              comments: transaction.comments,
              date: new Date(transaction.date),
              type: transaction.type,
              amount: transaction.amount
            }
        );
      })
    }
    if (Categories.find().count() === 0) {
      var categories = JSON.parse(Assets.getText("categories.json"));
      _.each(categories, function (category) {
        Categories.insert(
            {
              _id: category._id,
              amount: Math.abs(category.amount)
            }
        );
      })
    }
  });
}

/**
 * General Helper Functions.
 */
function getSelectedMonthStartDate() {
  if (Session.get("selectedMonth") != null) {
    return Session.get("selectedMonth");
  }
  else {
    var today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }
}

function getAmountUsedForMonth(transaction, monthStartDate) {
  var amountUsed = 0;
  var firstDay = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth(), 1);
  var lastDay = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 1);
  txnsThisMonth = Transactions.find(
      {
        category_id: transaction._id,
        date: {
          $gte: firstDay,
          $lt: lastDay
        }
      }
  );
  txnsThisMonth.forEach(function (txn) {
    amountUsed -= txn.amount;
  });
  return amountUsed;
}