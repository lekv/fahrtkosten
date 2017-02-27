/* Copyright 2011-2014 Lars Volker <lv@lekv.de>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * setup the fahrtkosten form on the page
 */
var init = function() {
  // get the config for the selected year
  window.fkConfigs = {
    2011: [ 157, 283, 283 ],
    2012: [ 157, 287, 287 ],
    2013: [ 160, 293, 293 ],
  }

  // Set the year depending on the current date
  var year = (new Date()).getFullYear();
  // check, that the current year can be selected and has a config option
  // TODO: Select the largest year available, if current year is not configured
  var yearOption = $("input[name='year'][value='" + year + "']");
  if ((yearOption.length > 0) && (window.fkConfigs[year] != undefined)) {
    yearOption.attr("checked", "checked");
  }

  // clear all inputs, due to firefox auto-complete bug. Otherwise Firefox will autofill the form in a wrong way as it doesn't handle dynamically added fields correctly.
  $("#train, #km, #kfz, #mitfahrer, #sharekm, #sharerate, #rent, #nights, #hotel, #other, #signdate, #sign, .euro, .cent").val("");
  $("#kfz").val("0,30");
  $("#sharerate").val("0,02");
  $("input[type='checkbox']").each( function() {
    $(this).removeAttr("checked");
  });

  // setup date and time picker widgets
  $(".datefield").each(function(i, field) {
    //console.log($(field));
    $(field).datepicker({
      format: "%d.%m.%Y",
    });
  });
  $(".timefield").each(function(i, field) {
    $(field).timepicker({
      //      format: "%H:%i",
    });
  });

  // Prefill the sign date.
  var today = Date.today();
  $("#signdate").val(today.toString("dd.MM.yyyy"));

  // reload persisted data from the cache
  $(".persist").each(function() {
    var id = this.id;
    if (!id) {
      // jStorage will only work with an id
      console.log("Missing ID in persisted field");
      console.log(this);
      return;
    }
    var val = $.jStorage.get(id);
    if (! val) {
      // Try to find a default value in the DOM object.
      val = $(this).attr('default');
    }
    if (val) {
      $(this).val(val);
    }
  });

  // restore font size from the cache
  var restored_font_size = $.jStorage.get("font-size");
  if (restored_font_size) {
    $("body").css("font-size", restored_font_size);
  }

  // Setup handlers

  // Year selection handler
  $("input[name='year']").bind("change", function() {
    $.event.trigger("globalUpdate");
  });
  
  // The storage handler for all autopersist fields
  $(".persist").bind("change", function() {
    // save the current value to the id
    var id = this.id;
    var val = $(this).val();
    $.jStorage.set(id, val);
    //console.log($.jStorage.index());
  });

  // Handler for the print and clear buttons button
  $("#print").bind("click", function() {
    window.print();
  });
  $("#clear").bind("click", function() {
    $.jStorage.flush();
  });
  // Handler for the font size buttons
  $("#font_bigger").bind("click", function() {
    $("body").css("font-size", "+=1");
    var size = $("body").css("font-size");
    $.jStorage.set("font-size", size);
    // Scroll to the bottom of the page
    $("html").scrollTop($(document).height() - $(window).height());
  });
  $("#font_smaller").bind("click", function() {
    $("body").css("font-size", "-=1");
    var size = $("body").css("font-size");
    $.jStorage.set("font-size", size);
    // Scroll to the bottom of the page
    $("html").scrollTop($(document).height() - $(window).height());
  });

  // The add day button
  $("#addday").bind("click", function() {
    add_day_line();
  });
  // Clear all days
  $("#cleardays").bind("click", function() {
    $(".day").remove();
  });

  // The list days button
  $("#listdays").bind("click", function() {
    list_days();
  });

  // Automatically update handler for single-amount-fields
  $("#train, #rent, #other").bind("change keyup", function() {
    update_line_from_field(this);
  });

  // Update-Handler for the car fields.
  $("#km, #kfz").bind("change keyup", function() {
    var line = $(this).parents("tr");
    var km  = parseInt($("#km").val());
    var val = $("#kfz").val();
    val = String(val);
    val = val.clean();
    //
    // evaluate to allow statements like "2+2"
    try {
      val = eval(val);
    } catch(ex) {};

    // Only keep full cents
    val = Math.round(parseFloat(val) * 100);
    set_amounts(line, val * km);
  });

  // Update handler for the shared ride fields
  $("#sharekm, #sharerate, #mitfahrer").bind("change keyup", function() {
    var line = $(this).parents("tr");
    var count = parseInt($("#mitfahrer").val());
    if (count) {
      $("#sharerow").show();
    } else {
      $("#sharerow").hide();
    }
    var km  = parseInt($("#sharekm").val());
    var val = $("#sharerate").val();
    val = String(val);
    val = val.clean();
    //
    // evaluate to allow statements like "2+2"
    try {
      val = eval(val);
    } catch(ex) {};

    // Only keep full cents
    val = Math.round(parseFloat(val) * 100);
    set_amounts(line, val * km * count);
  });

  // Update-handler for the hotel line.
  $("#nights, #hotel, #minusbreakfast").bind("change keyup globalUpdate", function() {
    var line = $(this).parents("tr");
    update_hotel_line(line);
  });

};

var getSelectedYear = function() {
  var year = $("input[name  = 'year']:checked").val();
  year     = parseInt(year)
  return year;
}

/**
 * Adds a single day to the list of days.
 */
var add_day_line = function(date, pay) {
  // The template line to be added
  var line = $('<tr class="day"><td>Datum: <input name="date" size="10" type="text"/>, Tagegeld zu <input name="pay" size="5" type="text"/> &euro;, abzügl. <input type="checkbox" class="meal" />Frühst. <input type="checkbox" class="meal" />Mittag <input type="checkbox" class="meal" />Abend</td><td class="amount borderbottom"><input class="euro linetotals" size="2" type="text"/></td><td class="amount borderbottom"><input class="cent linetotals" size="2" type="text"/></td></tr>');
  // Link to delete the line. It will be shown in front of the line.
  var rm_link = $('<a href="#" class="dellinelink">Löschen</a>');
  // Add functionality to the delete link
  rm_link.click( function() {
    line.remove();
    // removed line, update totals
    update_totals();
    // prevent further link actions
    return false;
  });
  // add the link with a little space
  line.children().first().prepend("&ensp;");
  line.children().first().prepend( rm_link );

  // scan the line for the "date" and "pay" fields and update the values according to the passed parameters
  line.find("input[name='date']").val(date);
  line.find("input[name='pay']").val(pay);

  line.find("input[name='pay']").bind("change keyup", function() {
    update_day_line(line);
  });

  // Update the lines totals.
  update_day_line(line);

  // Add the line to the DOM.
  $("#daydummy").before(line);

  // Register the update-handler with all checkboxes on the line.
  $(line).find(".meal").bind("change globalUpdate", function() {
    update_day_line(line);
  });

  // Update the overall total sum. This is needed as the line was updated before it was added to the DOM. It won't do any harm as well.
  update_totals();
};

/**
 * Lists all days between the specified start and end dates.
 * Automatically computes the duration of the first and last day and fills the pay field accordingly.
 */
var list_days = function() {
  // Remove all previously added days to start with an empty list.
  $(".day").remove();

  // Format string for the autofilled date fields
  var fmt = "dd.MM.yyyy";

  // Verify the inputs
  var start_date = $("#startdate").val();
  var start_time = $("#starttime").val();
  var end_date = $("#enddate").val();
  var end_time = $("#endtime").val();
  if (!start_date | !start_time) { alert("Geben Sie Datum und Uhrzeit der Abfahrt an."); return 1; };
  if (!end_date | !end_time) { alert("Geben Sie Datum und Uhrzeit Ihrer Rückkehr an."); return 1; };

  // Date objects for start and end
  var start = Date.parse(start_date + " " + start_time);
  var end = Date.parse(end_date + " " + end_time);


  // Tuples specifying the compensation to be received per share of the day. For the first 8 hours one gets 6 Euros, for the next 6 hours another 6 Euros and for the next 10 hours another 12 Euros
  // Format [ hours, amount ]
  var cfg = [ [8, 6], [14, 12], [24, 24]];

  // This is the beginning of the second day of the trip, 00:00 during the first night.
  var day2 = start.clone().clearTime().add(1).days();
  // The duration of the first day in seconds.
  var first_day_duration;
  if (day2.compareTo(end) < 0) {
    // day2 < end -> Multiple days
    first_day_duration = day2 - start;
  } else {
    // day2 >= end -> Single day trip
    first_day_duration = end - start;
  }

  // compute the amount for the first day.
  var pay = 0;
  for (var i = 0; i < cfg.length; i++) {
    if (cfg[i][0] * 1000 * 3600 <= first_day_duration) {
      pay = cfg[i][1];
    }
  }
  // add the first day to the table
  add_day_line(start.toString(fmt), pay);

  // the beginning of the last day of the trip. This is 00:00 during the last night.
  var dayn = end.clone().clearTime();
  // add intermediate days by counting up day2
  while (day2.compareTo(dayn) < 0) {
    add_day_line(day2.toString(fmt), cfg[cfg.length-1][1]);
    day2.add(1).days();
  }

  // compute last day duration
  var last_day = end - dayn;
  //console.log(last_day);
  if (day2.compareTo(end) < 0) {
    pay = 0;
    for (var i = 0; i < cfg.length; i++) {
      if (cfg[i][0] * 1000 * 3600 <= last_day) {
        pay = cfg[i][1];
      }
    }
    add_day_line(dayn.toString(fmt), pay);
  }

  return 0;
}

/**
 * Sets the amounts in the righthandside columns in a line.
 *
 * @param {jquery object} line : the line in which to set the fields.
 * @param {int} val            : the amount to be set in cents.
 */
var set_amounts = function( line, val ) {
  if (val) {
    // Replace "," with "."
    // This is usually done before, but make sure we do it here.
    val = String(val);
    val = val.clean();
    //
    // evaluate to allow statements like "2+2"
    try {
      val = eval(val);
    } catch(ex) {};

    // Only keep full cents
    val = Math.round(parseFloat(val));
    // Ignore negative values
    var euro = Math.max(0, Math.floor(val / 100));
    var cent = Math.max(0, val % 100);
    // update the fields.
    line.find(".euro").val(euro);
    line.find(".cent").val(cent);
  } else {
    // blank the line totals
    line.find(".euro, .cent").val("");
  }
  // update the overall totals
  update_totals();
}

/**
 * Updates a line's totals from a single field. The line is determined by 
 * looking up the parents tr object in the DOM.
 *
 * @param {jquery object} field : the field which line is to be updated
 */
var update_line_from_field = function(field) {
  // find the line, which is the parent tr
  var line = $(field).parents("tr");
  var val = $(field).val();
  val = String(val);
  val = val.clean();
  //
  // evaluate to allow statements like "2+2"
  try {
    val = eval(val);
  } catch(ex) {};

  // Only keep full cents
  val = Math.round(parseFloat(val)*100);
  set_amounts(line, val);

}

/**
 * Updates a single day's line after the day's compensation or the meal
 * checkboxes have been changed.
 */
var update_day_line = function(line) {
  // to avoid rounding errors, this function uses cent values internally
  var meals = window.fkConfigs[getSelectedYear()];
  // find the field which contains the days compensation
  var field = line.find(":eq(0) input[name='pay']");
  // sanitize the input
  var val = $(field).val().clean();
  var pay = Math.round(val * 100);
  // find the meal checkboxes
  var boxes = line.find(":eq(0) input:checkbox");
  // subtract compensation for checked meals
  for (var i = 0; i < boxes.length; i++) {
    if ($(boxes[i]).is(":checked")) {
      pay -= meals[i];
    }
  };

  // set values, no negative amounts allowed
  var euro = Math.max(0, Math.floor(pay / 100));
  var cent = Math.max(0, pay % 100); 
  line.find(".euro").val(euro);
  line.find(".cent").val(cent);

  // The line changed, update the totals field
  update_totals();

}

/**
 * Updates the hotel line,
 * subtracts the breakfasts from the total payment.
 */
var update_hotel_line = function(line) {
  var meals = window.fkConfigs[getSelectedYear()];
  var breakfastShare = meals[0];
  // the number of nights spent in a hotel
  var nights = $(line).find("#nights").val();
  nights = parseInt(nights);
  // the amount spent on the hotel in total
  var expense = $(line).find("#hotel").val().clean();
  expense = Math.round(parseFloat(expense) * 100);
  // check, whether to subtract breakfast
  var minusbf = $(line).find("#minusbreakfast");
  if (nights && minusbf.is(":checked")) {
    // TODO: Add global config for meal expenses
    expense -= nights * breakfastShare;
  }
  set_amounts(line, expense);
}


/**
 * Update the total sum from each line's euro and cent fields
 */
var update_totals = function() {
  var sum = 0;
  $(".euro, .cent").not(".sum").each( function() {
    //console.log($(this).val());
    var val = $(this).val();
    if (val) {
      if ($(this).is(".euro")) {
        val *= 100;
      }
      sum += parseInt(val);
    }
  });
  var euro = Math.max(0, Math.floor(sum / 100));
  var cent = Math.max(0, sum % 100);
  $("#eurosum").val(euro);
  $("#centsum").val(cent);
};

String.prototype.clean = function() {
  var str = this.toString();
  //console.log("cleaning: " + str);
  // Remove comments
  str = str.replace(/\(.*?\)/g, "");
  // Remove last comment even if partial
  str = str.replace(/\(.*?$/, "");
  // Remove ",-"
  str = str.replace(/,-/g, "");
  // Replace "," by "."
  str = str.replace(/,/g, ".");
  //console.log("returning cleaned: " + str);
  return str;
}
