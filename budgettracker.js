// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

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
  Template.body.events({
    'change .month-select': function () {
      var date = new Date(Date.parse(event.target.value + " 01", "yyyy-MM dd"));
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
      console.log(Categories.find().fetch());
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
      console.log("OKOKKO" + dateFormatted);
      return dateFormatted;
    }
  });
  Template.transactionslist.events(
      {
        'click div.add-transaction': function () {
          Session.set("adding_transaction", true);
        }
      }
  );
  Template.body.events({
    'submit form.add-transaction': function () {
      // Prevent default browser form submit
      event.preventDefault();
      var category = event.target.category.value;
      var amount = event.target.amount.value;
      var date = event.target.date.value;
      var comments = event.target.comments.value;
      Transactions.insert({
        category_id: category,
        amount: parseFloat(amount),
        date: new Date(date),
        comments: comments
      });
      Session.set("adding_transaction", false);
    }
  });

  /**
   * Categories List Helpers
   */
  Template.categorieslist.helpers({
    categories: function () {
      console.log(Categories.find().fetch());
      return Categories.find();
    },
    isAddingCategory: function () {
      return Session.get("adding_category");
    },
    getAmountLeftForThisMonth: function () {
      var totalAmountForMonth = 0;
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
        totalAmountForMonth += txn.amount;
      });
      //console.log("Total amount for: " + this._id + " = " + totalAmountForMonth);
      return this.amount - totalAmountForMonth;
    }
  });
  Template.categorieslist.events(
      {
        'click div.add-category': function () {
          console.log("111");
          Session.set("adding_category", true);
        }
      }
  );
  Template.body.events({
    'submit form.add-category': function () {
      // Prevent default browser form submit
      event.preventDefault();
      var name = event.target.name.value;
      var amount = event.target.amount.value;
      Categories.insert({_id: name, amount: parseFloat(amount)});
      Session.set("adding_category", false);
    }
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Transactions.find().count() === 0) {
      var transactions = JSON.parse(Assets.getText("transactions.json"));
      _.each(transactions, function (transaction) {
        console.log("Transaction: " + transaction.category_id)
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
    /*
     if (Categories.find().count() === 0) {
     var categories = [
     {_id: "General Spending", amount: 333.00},
     {_id: "Dining Out", amount: 13.00},
     {_id: "Gasoline", amount: 121.00},
     {_id: "Groceries", amount: 551.00}
     ];
     _.each(categories, function (category) {
     Categories.insert(category);
     })
     }

     if (Transactions.find().count() === 0) {
     var transactions = [
     {category_id: "Groceries", comments: "foo", date: new Date(2015, 8, 13), amount: 8.99},
     {category_id: "Groceries", comments: "foo", date: new Date(2015, 8, 13), amount: 6.99},
     {category_id: "General Spending", comments: "foo1", date: new Date(2015, 8, 13), amount: 72.00},
     {category_id: "Dining Out", comments: "foo2", date: new Date(2015, 8, 14), amount: 82.49},
     {category_id: "Groceries", comments: "foo", date: new Date(2015, 7, 13), amount: 8.99},
     {category_id: "Groceries", comments: "foo", date: new Date(2015, 7, 13), amount: 6.99},
     {category_id: "General Spending", comments: "foo1", date: new Date(2015, 7, 13), amount: 72.00},
     {category_id: "Dining Out", comments: "foo2", date: new Date(2015, 7, 14), amount: 82.49}];

     _.each(transactions, function (category) {
     Transactions.insert(category);
     });
     }
     */
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