// http://www.queness.com/post/112/a-really-simple-jquery-plugin-tutorial
(function($){
  $.fn.extend({
    // Define the localStore plugin
    // options: parameters of the plugin to use
    localStore: function(options) {
      // Set default parameter dict
      var defaults = {
        defaultString: "Name, Anschrift",
      }
      // Extend the defaults with the options specified by the user.
      var options = $.extend(defaults, options);

      var element = this;
      var key = element.attr('id');

      var controls = $("<div/>");

      var inputBox = $("<input type='text' />");
      inputBox.css('display', 'block');
      inputBox.hide();

      // Edit button
      var editButton = $("<input type='button' value='Bearbeiten' />");
      editButton.click(function() {
        editButton.hide();
        saveButton.show();
        element.hide();
        var content = element.text();
        inputBox.val(content);
        inputBox.show();
        var width = Math.max(30, content.length * 0.7);
        inputBox.css('width', width + "em");
      });
      controls.append(editButton);

      // Save button. It is hidden and will be shown when edit button is clicked
      var saveButton = $("<input type='button' value='Speichern' />");
      saveButton.click(function() {
        saveButton.hide();
        editButton.show();
        var content = inputBox.val();
        //element.empty();
        element.html(content);
        inputBox.hide();
        element.show();
        $.jStorage.set(key, content);
        
      });
      saveButton.css('display', 'inline');
      controls.append(saveButton);
      saveButton.hide();

      // delete button
      var deleteButton = $("<input type='button' value='Löschen' />");
      deleteButton.click(function() {
        inputBox.val("");
        inputBox.hide();
        element.html(options.defaultString);
        element.show();
        editButton.show();
        saveButton.hide();
        $.jStorage.deleteKey(key);
      });
      controls.append(deleteButton);

      // Add controls
      element.after(centeredWrapper(controls));
      element.after(centeredWrapper(inputBox));

      // Load Values from the local store
      var val = $.jStorage.get(key);
      if (val) {
        element.html(val);
      } else {
        element.html(options.defaultString);
      }

    }
  });

  var centeredWrapper = function(element) {
    // return a jquery object with two divs wrapping the element
    var outer = $("<div class='localstorewrapper' />");
    var inner = $("<div class='localstore' />");
    outer.append(inner);
    inner.append(element);
    return outer;
  }

})(jQuery);

// vim: ts=2 sw=2 et si
