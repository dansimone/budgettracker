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
      return Transactions.find(
          {
            date: {
              $gte: firstDay,
              $lt: lastDay
            }
          }, {sort: {date: -1}});
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
    getTodaysDateFormatted: function () {
      var today = new Date();
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
          var category = event.target.category.value;
          var amount = event.target.amount.value;
          var dateString = event.target.date.value + " PDT";
          var comments = event.target.comments.value;

          Transactions.insert({
            category_id: category,
            amount: parseFloat(amount),
            date: new Date(dateString),
            comments: comments
          });
          Session.set("adding_transaction", false);
        }
      }
  );

  /**
   * Categories List Helpers
   */
  Template.categorieslist.helpers({
    categories: function () {
      return Categories.find({}, {sort: {_id: 1}});;
    },
    isAddingCategory: function () {
      return Session.get("adding_category");
    },
    getAmountUsedForThisMonth: function () {
      var amountUsed = 0;
      var monthStartDate = getSelectedMonthStartDate();
      var firstDay = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth(), 1);
      var lastDay = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 1);
      txnsThisMonth = Transactions.find(
          {
            category_id: this._id,
            date: {
              $gte: firstDay,
              $lt: lastDay
            }
          }
      );
      txnsThisMonth.forEach(function (txn) {
        //console.log("RRR " + txn.date);
        amountUsed += txn.amount;
      });
      //console.log("Total amount for: " + this._id + " = " + totalAmountForMonth);
      return amountUsed;
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
            console.log("YEAH1");
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
              amount: transaction.amount
            }
        );
      })
    }
    if (Categories.find().count() === 0) {
      var categories = JSON.parse(Assets.getText("categories.json"));
      _.each(categories, function (category) {
        Categories.insert(category);
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