Players = new Mongo.Collection("players");
Categories = new Mongo.Collection("categories");
Transactions = new Mongo.Collection("transactions");

if (Meteor.isClient) {
  /**
   * Main Helpers
   */
  Template.main.helpers({
    isLoggedIn: function () {
      return Session.get("logged-in") != null && Session.get("logged-in");
    }
  });
  Template.main.events({
    'click a.logout': function () {
      event.preventDefault();
      Session.clear("logged-in");
      Meteor.logout();
    }
  });

  /**
   * Sign In Helpers
   */
  Template.signin.events({
    'submit form.login-form': function () {
      event.preventDefault();
      var signInForm = $(event.currentTarget);
      var password = signInForm.find('.password').val();
      Meteor.loginWithPassword("foo", password, function (error) {
        // 3. Handle the response
        if (Meteor.user()) {
          Session.setPersistent("logged-in", true);
        } else {
          var l = 20;
          for (var i = 0; i < 7; i++) {
            signInForm.animate({'margin-left': "+=" + ( l = -l ) + 'px'}, 50);
          }
          document.getElementById('password').value = "";
        }
      });
      return false;
    }
  });

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
    getErrorClass: function (fieldName) {
      return getErrorClass(fieldName);
    },
    getTodaysDateFormatted: function () {
      var today = new Date();
      var month = today.getMonth() + 1;
      month = month < 10 ? '0' + month : '' + month;
      var day = today.getDate();
      day = day < 10 ? '0' + day : '' + day;
      var dateFormatted = today.getFullYear() + "-" + month + "-" + day;
      //console.log("OKOKKO" + dateFormatted);
      return dateFormatted;
    }
  });
  Template.transactionslist.events(
    {
      'click div.add-transaction a': function () {
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

        var error = false;
        var amount = event.target.amount.value;
        if (amount.length == 0) {
          Session.set("formError-transaction-amount", true);
          error = true;
        }
        else {
          Session.set("formError-transaction-amount", false);
        }
        var dateString = event.target.date.value + " PDT";
        if (event.target.date.value.length == 0) {
          Session.set("formError-transaction-date", true);
          error = true;
        }
        else {
          Session.set("formError-transaction-date", false);
        }
        // Return control if any form errors found
        if (error) {
          return;
        }

        var comments = event.target.comments.value;
        var type = event.target.type.value;
        var category;
        if (type == "deposit") {
          category = "deposit";
        }
        else {
          category = event.target.category.value;
        }

        // If the date entered is today, use the exact time now as the Date, otherwise
        // just use the day
        var date = new Date(dateString);
        var today = new Date();
        if (today.getFullYear() == date.getFullYear() && today.getMonth() == date.getMonth()
          && today.getDate() == date.getDate()) {
          date = today;
        }

        Transactions.insert({
          category_id: category,
          amount: parseFloat(-amount),
          date: date,
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
      },
      'click .form-group.has-error input,textarea': function (event) {
        Session.set("formError-" + event.target.closest('.form-group').getAttribute("name"), false);
      },
      'click tr.transaction-row td span.transaction-amount': function () {
        var cell = $(event.target);
        var currentAmount = cell.text();
        cell.text("");
        var txnId = cell.closest('tr').attr("id");
        $('<input />').appendTo(cell).val(currentAmount).select().on("blur keyup",
          function (event) {
            // Ignore anything that is a key press but *not* an enter
            if (event.keyCode != null && event.keyCode != 13) {
              return;
            }
            // Restore value if not a number
            var newAmount;
            if (isNaN($(this).val())) {
              newAmount = currentAmount;
            }
            else {
              newAmount = parseFloat($(this).val()).toFixed(2);
            }
            cell.find("input").remove();
            if (newAmount != currentAmount) {
              cell.text("");
              Transactions.update({_id: txnId}, {$set: {amount: parseFloat(newAmount)}});
            }
            else {
              cell.text(newAmount);
            }
          });
      },
      'click tr.transaction-row td a.transaction-remove': function () {
        event.preventDefault();
        var cell = $(event.target);
        var txnId = cell.closest('tr').attr("id");
        if (confirm("Are you sure you want to delete this transaction?") == true) {
          Transactions.remove(txnId);
        }
      }
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
    },
    getErrorClass: function (fieldName) {
      return getErrorClass(fieldName);
    }
  });
  Template.categorieslist.events(
    {
      'click div.add-category a': function () {
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
        var error = false;
        var name = event.target.name.value;
        if (name.length == 0) {
          Session.set("formError-category-name", true);
          error = true;
        }
        else {
          Session.set("formError-category-name", false);
        }
        var amount = event.target.amount.value;
        if (amount.length == 0) {
          Session.set("formError-category-amount", true);
          error = true;
        }
        else {
          Session.set("formError-category-amount", false);
        }
        // Return control if any form errors found
        if (error) {
          return;
        }

        Categories.insert({_id: name, amount: parseFloat(amount)});
        Session.set("adding_category", false);
      },
      'click .form-group.has-error input,textarea': function (event) {
        Session.set("formError-" + event.target.closest('.form-group').getAttribute("name"), false);
      },
      'click tr.category-row td span.category-amount': function () {
        var cell = $(event.target);
        var currentAmount = cell.text();
        cell.text("");
        var categoryId = cell.closest('tr').attr("id");
        $('<input />').appendTo(cell).val(currentAmount).select().on("blur keyup",
          function (event) {
            // Ignore anything that is a key press but *not* an enter
            if (event.keyCode != null && event.keyCode != 13) {
              return;
            }
            // Restore value if not a number
            var newAmount;
            if (isNaN($(this).val())) {
              newAmount = currentAmount;
            }
            else {
              newAmount = parseFloat($(this).val()).toFixed(2);
            }
            cell.find("input").remove();
            if (newAmount != currentAmount) {
              cell.text("");
              Categories.update({_id: categoryId}, {$set: {amount: parseFloat(newAmount)}});
              console.log("Updated " + categoryId + " to " + newAmount);
            }
            else {
              cell.text(newAmount);
            }
          });
      },
      'click tr.category-row td a.category-remove': function () {
        event.preventDefault();
        var cell = $(event.target);
        var categoryId = cell.closest('tr').attr("id");
        if (confirm("Are you sure you want to delete this category?") == true) {
          Categories.remove(categoryId);
          // Delete any matching transactions
          matchingTransactions = Transactions.find(
            {
              category_id: categoryId
            });
          matchingTransactions.forEach(function (transaction) {
            Transactions.remove(transaction._id);
          });
        }
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
        //console.log("OKOK " + transaction.amount);
        Transactions.insert(
          {
            category_id: transaction.category_id,
            comments: transaction.comments,
            date: new Date(transaction.date),
            type: transaction.type.toLowerCase(),
            amount: transaction.amount
          }
        );
      })
    }
    if (Categories.find().count() === 0) {
      var categories = JSON.parse(Assets.getText("categories.json"));
      _.each(categories, function (category) {
        Categories.insert({
          _id: category._id,
          amount: Math.abs(category.amount)
        });
      })
    }
    if (Meteor.users.find().count() === 0) {
      var users = JSON.parse(Assets.getText("users.json"));
      _.each(users, function (user) {
        Meteor.users.insert(user);
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

function getErrorClass(fieldName) {
  if (Session.get("formError-" + fieldName) != null && Session.get("formError-" + fieldName)) {
    return "has-error";
  }
  else {
    return "";
  }
}
