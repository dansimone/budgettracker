# Budget Tracker
BudgetTracker is a lightweight Meteor app for managing a personal budget.&nbsp;&nbsp;It was written with one thing in mind - to provide a **very simple** way to manually manage one's personal budget.&nbsp;&nbsp;You won't find page after page of data to sift through or long wizards to complete to enter data - this is a single-page application based on the Meteor framework that updates reactively as data is entered.&nbsp;&nbsp;The visuals are based on Twitter Bootstrap, so it's very mobile-friendly.

## How to Set Up

### Prerequisites
* Ensure you have [Node](http://nodejs.org/download/) and [Meteor](http://meteor.com) installed.

### Download
```bash
git clone https://github.com/dansimone/budgettracker
```

### Run
```bash
cd budgettracker
meteor
```

### Login
Navigate to http://localhost:3000, and login with the default (out of the box) password: **password**

## Live Heroku Deployment
https://mybudgettracker.herokuapp.com/

## Functionality

### Current Functionality
* Users
  * Single-user only.
  * Default password is  **password**.
  * Password can be changed via User->Change Password.
* Month Selection
  * Selecting a month displays the budget for that month.
* Sample Data
  * The first time the app first starts, an initial set of sample Categories and Transactions are created.&nbsp;&nbsp;Any of these can be deleted by clicking the X next to their respective rows.
* Categories
  * Can be added by clicking the + under the "Categories" section.
  * The "Used" column displays a progress bar indicating the current usage for a given budget Category.&nbsp;&nbsp;The progress bar is displayed as green/orange/red, depending on what percentage of the Category's budget has been used.
  * A Category's amount can be changed after the fact by clicking on the "Amount" column table cell, and entering a new amount.
* Transactions
  * Can be added by clicking the + under the "Transactions" section.
  * No restrictions on the dates for which budget transactions can be entered.
  * A Transaction's amount can be changed after the fact by clicking on the "Amount" column table cell, and entering a new amount.


## Areas that Could be Expanded
* Allowing multiple users to track separate budgets
* Allowing multiple users to collaborate on the same budget.
* Allowing Category amounts to be changed per month.&nbsp;&nbsp;Currently, changing the budget amount for a Category will take effect for all months.
* Some (**lightweight**) charts to help visualize month-by-month budget progress.


## Contributing
Pull requests welcome!

