// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var widget = require("./widget");
var utils = require("./utils");
var $ = require("./jquery");
var _ = require("underscore");

    var SelectionModel = widget.DOMWidgetModel.extend({
        defaults: _.extend({}, widget.DOMWidgetModel.prototype.defaults, {
            _model_name: "SelectionModel",
            selected_label: "",
            _options_labels: [],
            disabled: false,
            description: "",
        }),
    });

    var DropdownModel = SelectionModel.extend({
        defaults: _.extend({}, SelectionModel.prototype.defaults, {
            _model_name: "DropdownModel",
            _view_name: "DropdownView",
            button_style: ""
        }),
    });

    var DropdownView = widget.DOMWidgetView.extend({
        render : function() {
            this.$el
                .addClass('jupyter-widgets widget-hbox widget-dropdown');
            this.$label = $('<div />')
                .appendTo(this.$el)
                .addClass('widget-label')
                .hide();
            this.$buttongroup = $('<div />')
                .addClass('widget_item')
                .addClass('btn-group')
                .appendTo(this.$el);
            this.$droplabel = $('<button />')
                .addClass('btn btn-default')
                .addClass('widget-combo-btn')
                .html("&nbsp;")
                .appendTo(this.$buttongroup);
            this.$dropbutton = $('<button />')
                .addClass('btn btn-default')
                .addClass('dropdown-toggle')
                .addClass('widget-combo-carrot-btn')
                .attr('data-toggle', 'dropdown')
                .append($('<span />').addClass("caret"))
                .appendTo(this.$buttongroup);
            this.$droplist = $('<ul />')
                .addClass('dropdown-menu')
                .appendTo(this.$buttongroup);

            this.listenTo(this.model, "change:button_style", this.update_button_style, this);
            this.update_button_style();

            // Set defaults.
            this.update();
        },

        update : function(options) {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been
             * changed by another view or by a state update from the back-end.
             */

            if (options === undefined || options.updated_view != this) {
                var selected_item_text = this.model.get('selected_label');
                if (selected_item_text.trim().length === 0) {
                    this.$droplabel.html("&nbsp;");
                } else {
                    this.$droplabel.text(selected_item_text);
                }

                var items = this.model.get('_options_labels');
                var $replace_droplist = $('<ul />')
                    .addClass('dropdown-menu');
                // Copy the style
                $replace_droplist.attr('style', this.$droplist.attr('style'));
                var that = this;
                _.each(items, function(item, i) {
                    var item_button = $('<a href="#"/>')
                        .text(item)
                        .on('click', $.proxy(that.handle_click, that));
                    $replace_droplist.append($('<li />').append(item_button));
                });

                this.$droplist.replaceWith($replace_droplist);
                this.$droplist.remove();
                this.$droplist = $replace_droplist;

                if (this.model.get('disabled')) {
                    this.$buttongroup.attr('disabled','disabled');
                    this.$droplabel.attr('disabled','disabled');
                    this.$dropbutton.attr('disabled','disabled');
                    this.$droplist.attr('disabled','disabled');
                } else {
                    this.$buttongroup.removeAttr('disabled');
                    this.$droplabel.removeAttr('disabled');
                    this.$dropbutton.removeAttr('disabled');
                    this.$droplist.removeAttr('disabled');
                }

                var description = this.model.get('description');
                if (description.length === 0) {
                    this.$label.hide();
                } else {
                    this.typeset(this.$label, description);
                    this.$label.show();
                }
            }
            return DropdownView.__super__.update.apply(this);
        },

        update_button_style: function() {
            var class_map = {
                primary: ['btn-primary'],
                success: ['btn-success'],
                info: ['btn-info'],
                warning: ['btn-warning'],
                danger: ['btn-danger']
            };
            this.update_mapped_classes(class_map, 'button_style', this.$droplabel[0]);
            this.update_mapped_classes(class_map, 'button_style', this.$dropbutton[0]);
        },

        update_attr: function(name, value) { // TODO: Deprecated in 5.0
            /**
             * Set a css attr of the widget view.
             */
            if (name.substring(0, 6) == 'border' || name == 'background' || name == 'color') {
                this.$droplabel.css(name, value);
                this.$dropbutton.css(name, value);
                this.$droplist.css(name, value);
            } else {
                this.$el.css(name, value);
            }
        },

        handle_click: function (e) {
            /**
             * Handle when a value is clicked.
             *
             * Calling model.set will trigger all of the other views of the
             * model to update.
             */
            this.model.set('selected_label', $(e.target).text(), {updated_view: this});
            this.touch();

            // Manually hide the droplist.
            e.stopPropagation();
            e.preventDefault();
            this.$buttongroup.removeClass('open');
        },

    });

    var RadioButtonsModel = SelectionModel.extend({
        defaults: _.extend({}, SelectionModel.prototype.defaults, {
            _model_name: "RadioButtonsModel",
            _view_name: "RadioButtonsView",
            tooltips: [],
            icons: [],
            button_style: ""
        }),
    });

    var RadioButtonsView = widget.DOMWidgetView.extend({
        render : function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('jupyter-widgets widget-hbox widget-radio');
            this.$label = $('<div />')
                .appendTo(this.$el)
                .addClass('widget-label')
                .hide();
            this.$container = $('<div />')
                .appendTo(this.$el)
                .addClass('widget-radio-box');
            this.update();
        },

        update : function(options) {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been
             * changed by another view or by a state update from the back-end.
             */
            if (options === undefined || options.updated_view != this) {
                // Add missing items to the DOM.
                var items = this.model.get('_options_labels');
                var disabled = this.model.get('disabled');
                var that = this;
                _.each(items, function(item, index) {
                    var item_query = ' :input[data-value="' + encodeURIComponent(item) + '"]';
                    if (that.$el.find(item_query).length === 0) {
                        var $label = $('<label />')
                            .addClass('radio')
                            .text(item)
                            .appendTo(that.$container);

                        $('<input />')
                            .attr('type', 'radio')
                            .addClass(that.model)
                            .val(item)
                            .attr('data-value', encodeURIComponent(item))
                            .prependTo($label)
                            .on('click', $.proxy(that.handle_click, that));
                    }

                    var $item_element = that.$container.find(item_query);
                    if (that.model.get('selected_label') == item) {
                        $item_element.prop('checked', true);
                    } else {
                        $item_element.prop('checked', false);
                    }
                    $item_element.prop('disabled', disabled);
                });

                // Remove items that no longer exist.
                this.$container.find('input').each(function(i, obj) {
                    var value = $(obj).val();
                    var found = false;
                    _.each(items, function(item, index) {
                        if (item == value) {
                            found = true;
                            return false;
                        }
                    });

                    if (!found) {
                        $(obj).parent().remove();
                    }
                });

                var description = this.model.get('description');
                if (description.length === 0) {
                    this.$label.hide();
                } else {
                    this.$label.text(description);
                    this.typeset(this.$label, description);
                    this.$label.show();
                }
            }
            return RadioButtonsView.__super__.update.apply(this);
        },

        update_attr: function(name, value) {
            /**
             * Set a css attr of the widget view.
             */
            if (name == 'padding' || name == 'margin') {
                this.$el.css(name, value);
            } else {
                this.$container.css(name, value);
            }
        },

        handle_click: function (e) {
            /**
             * Handle when a value is clicked.
             *
             * Calling model.set will trigger all of the other views of the
             * model to update.
             */
            this.model.set('selected_label', $(e.target).val(), {updated_view: this});
            this.touch();
        },
    });

    var ToggleButtonsModel = SelectionModel.extend({
        defaults: _.extend({}, SelectionModel.prototype.defaults, {
            _model_name: "ToggleButtonsModel",
            _view_name: "ToggleButtonsView",
        }),
    });

    var ToggleButtonsView = widget.DOMWidgetView.extend({
        initialize: function() {
            this._css_state = {};
            ToggleButtonsView.__super__.initialize.apply(this, arguments);
        },

        render: function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('jupyter-widgets widget-hbox widget-toggle-buttons');
            this.$label = $('<div />')
                .appendTo(this.$el)
                .addClass('widget-label')
                .hide();
            this.$buttongroup = $('<div />')
                .addClass('btn-group')
                .appendTo(this.$el);

            this.listenTo(this.model, 'change:button_style', this.update_button_style, this);
            this.update_button_style();
            this.update();
        },

        update : function(options) {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been
             * changed by another view or by a state update from the back-end.
             */
            if (options === undefined || options.updated_view != this) {
                // Add missing items to the DOM.
                var items = this.model.get('_options_labels');
                var icons = this.model.get('icons');
                var previous_icons = this.model.previous('icons') || [];
                var disabled = this.model.get('disabled');
                var that = this;
                var item_html;
                _.each(items, function(item, index) {
                    if (item.trim().length === 0 && (!icons[index] ||
                        icons[index].trim().length === 0)) {
                        item_html = "&nbsp;";
                    } else {
                        item_html = utils.escape_html(item);
                    }
                    var item_query = '[data-value="' + encodeURIComponent(item) + '"]';
                    var $item_element = that.$buttongroup.find(item_query);
                    var $icon_element = $item_element.find('.fa');
                    if (!$item_element.length) {
                        $item_element = $('<button/>')
                            .attr('type', 'button')
                            .addClass('btn btn-default')
                            .html(item_html)
                            .appendTo(that.$buttongroup)
                            .attr('data-value', encodeURIComponent(item))
                            .attr('data-toggle', 'tooltip')
                            .attr('value', item)
                            .on('click', $.proxy(that.handle_click, that));
                        that.update_style_traits($item_element);
                        $icon_element = $('<i class="fa"></i>').prependTo($item_element);
                    }
                    if (that.model.get('selected_label') == item) {
                        $item_element.addClass('active');
                    } else {
                        $item_element.removeClass('active');
                    }
                    $item_element.prop('disabled', disabled);
                    $item_element.attr('title', that.model.get('tooltips')[index]);
                    $icon_element
                        .removeClass(previous_icons[index])
                        .addClass(icons[index]);
                });

                // Remove items that no longer exist.
                this.$buttongroup.find('button').each(function(i, obj) {
                    var value = $(obj).attr('value');
                    var found = false;
                    _.each(items, function(item, index) {
                        if (item == value) {
                            found = true;
                            return false;
                        }
                    });

                    if (!found) {
                        $(obj).remove();
                    }
                });

                var description = this.model.get('description');
                if (description.length === 0) {
                    this.$label.hide();
                } else {
                    this.$label.text();
                    this.typeset(this.$label, description);
                    this.$label.show();
                }
            }
            return ToggleButtonsView.__super__.update.apply(this);
        },

        update_attr: function(name, value) { // TODO: Deprecated in 5.0
            /**
             * Set a css attr of the widget view.
             */
            if (name == 'padding' || name == 'margin') {
                this.$el.css(name, value);
            } else {
                this._css_state[name] = value;
                this.update_style_traits();
            }
        },

        update_style_traits: function(button) {
            for (var name in this._css_state) {
                if (this._css_state.hasOwnProperty(name)) {
                    if (name == 'margin') {
                        this.$buttongroup.css(name, this._css_state[name]);
                    } else if (name != 'width') {
                        if (button) {
                            button.css(name, this._css_state[name]);
                        } else {
                            this.$buttongroup.find('button').css(name, this._css_state[name]);
                        }
                    }
                }
            }
        },

        update_button_style: function() {
            var class_map = {
                primary: ['btn-primary'],
                success: ['btn-success'],
                info: ['btn-info'],
                warning: ['btn-warning'],
                danger: ['btn-danger']
            };
            this.update_mapped_classes(class_map, 'button_style', this.$buttongroup.find('button')[0]);
        },

        handle_click: function (e) {
            /**
             * Handle when a value is clicked.
             *
             * Calling model.set will trigger all of the other views of the
             * model to update.
             */
            this.model.set('selected_label', $(e.target).attr('value'), {updated_view: this});
            this.touch();
        },
    });

    var SelectModel = SelectionModel.extend({
        defaults: _.extend({}, SelectionModel.prototype.defaults, {
            _model_name: "SelectModel",
            _view_name: "SelectView",
        }),
    });

    var SelectView = widget.DOMWidgetView.extend({
        render: function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('jupyter-widgets widget-hbox widget-select');
            this.$label = $('<div />')
                .appendTo(this.$el)
                .addClass('widget-label')
                .hide();
            this.$listbox = $('<select />')
                .addClass('widget-listbox form-control')
                .attr('size', 6)
                .appendTo(this.$el)
                .on('change', $.proxy(this.handle_change, this));
            this.update();
        },

        update: function(options) {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been
             * changed by another view or by a state update from the back-end.
             */
            if (options === undefined || options.updated_view != this) {
                // Add missing items to the DOM.
                var items = this.model.get('_options_labels');
                var that = this;
                _.each(items, function(item, index) {
                   var item_query = 'option[data-value="' + encodeURIComponent(item) + '"]';
                    if (that.$listbox.find(item_query).length === 0) {
                        $('<option />')
                            .text(item.replace ? item.replace(/ /g, '\xa0') : item) // replace string spaces with &nbsp; for correct rendering
                            .attr('data-value', encodeURIComponent(item))
                            .val(item)
                            .on("click", $.proxy(that.handle_click, that))
                            .appendTo(that.$listbox);
                    }
                });

                // Select the correct element
                this.$listbox.val(this.model.get('selected_label'));

                // Disable listbox if needed
                var disabled = this.model.get('disabled');
                this.$listbox.prop('disabled', disabled);

                // Remove items that no longer exist.
                this.$listbox.find('option').each(function(i, obj) {
                    var value = $(obj).val();
                    var found = false;
                    _.each(items, function(item, index) {
                        if (item == value) {
                            found = true;
                            return false;
                        }
                    });

                    if (!found) {
                        $(obj).remove();
                    }
                });

                var description = this.model.get('description');
                if (description.length === 0) {
                    this.$label.hide();
                } else {
                    this.typeset(this.$label, description);
                    this.$label.show();
                }
            }
            return SelectView.__super__.update.apply(this);
        },

        update_attr: function(name, value) { // TODO: Deprecated in 5.0
            /**
             * Set a css attr of the widget view.
             */
            if (name == 'padding' || name == 'margin') {
                this.$el.css(name, value);
            } else {
                this.$listbox.css(name, value);
            }
        },

        handle_click: function (e) {
            /**
             * Handle when a new value is clicked.
             */
            this.$listbox.val($(e.target).val()).change();
        },

        handle_change: function (e) {
            /**
             * Handle when a new value is selected.
             *
             * Calling model.set will trigger all of the other views of the
             * model to update.
             */
            this.model.set('selected_label', this.$listbox.val(), {updated_view: this});
            this.touch();
        },
    });
    
    var SelectionSliderModel = SelectionModel.extend({
        defaults: _.extend({}, SelectionModel.prototype.defaults, {
            _model_name: "SelectionSliderModel",
            _view_name: "SelectionSliderView",
            orientation: "horizontal",
            readout: true
        }),
    });
    
    var SelectionSliderView = widget.DOMWidgetView.extend({
        render : function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('jupyter-widgets widget-hbox widget-hslider');
            this.$label = $('<div />')
                .appendTo(this.$el)
                .addClass('widget-label')
                .hide();
            
            this.$slider = $('<div />')
                .slider({})
                .addClass('slider');
            // Put the slider in a container
            this.$slider_container = $('<div />')
                .addClass('slider-container')
                .append(this.$slider);
            this.$el.append(this.$slider_container);
            
            this.$readout = $('<div/>')
                .appendTo(this.$el)
                .addClass('widget-readout')
                .hide();
                
            this.listenTo(this.model, 'change:slider_handleTextChangecolor', function(sender, value) {
                this.$slider.find('a').css('background', value);
            }, this);
            this.listenTo(this.model, 'change:description', function(sender, value) {
                this.updateDescription();
            }, this);
            
            this.$slider.find('a').css('background', this.model.get('slider_color'));
            
            // Set defaults.
            this.update();
            this.updateDescription();
        },

        update_attr: function(name, value) { // TODO: Deprecated in 5.0
            /**
             * Set a css attr of the widget view.
             */
            if (name == 'color') {
                this.$readout.css(name, value);
            } else if (name.substring(0, 4) == 'font') {
                this.$readout.css(name, value);
            } else if (name.substring(0, 6) == 'border') {
                this.$slider.find('a').css(name, value);
                this.$slider_container.css(name, value);
            } else if (name == 'background') {
                this.$slider_container.css(name, value);
            } else {
                this.$el.css(name, value);
            }
        },
        
        updateDescription: function(options) {
            var description = this.model.get('description');
            if (description.length === 0) {
                this.$label.hide();
            } else {
                this.typeset(this.$label, description);
                this.$label.show();
            }
        },
        
        update: function(options) {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been 
             * changed by another view or by a state update from the back-end.
             */
            if (options === undefined || options.updated_view != this) {
                var labels = this.model.get("_options_labels");
                var max = labels.length - 1;
                var min = 0;
                this.$slider.slider('option', 'step', 1);
                this.$slider.slider('option', 'max', max);
                this.$slider.slider('option', 'min', min);
                
                // WORKAROUND FOR JQUERY SLIDER BUG.
                // The horizontal position of the slider handle
                // depends on the value of the slider at the time
                // of orientation change.  Before applying the new
                // workaround, we set the value to the minimum to
                // make sure that the horizontal placement of the
                // handle in the vertical slider is always 
                // consistent.
                var orientation = this.model.get('orientation');
                this.$slider.slider('option', 'value', min);
                this.$slider.slider('option', 'orientation', orientation);
                
                var selected_label = this.model.get("selected_label");                
                var index = labels.indexOf(selected_label);
                this.$slider.slider('option', 'value', index);
                this.$readout.text(selected_label);

                // Use the right CSS classes for vertical & horizontal sliders
                if (orientation=='vertical') {
                    this.$el
                        .removeClass('widget-hslider')
                        .addClass('widget-vslider');
                    this.$el
                        .removeClass('widget-hbox')
                        .addClass('widget-vbox');

                } else {
                    this.$el
                        .removeClass('widget-vslider')
                        .addClass('widget-hslider');
                    this.$el
                        .removeClass('widget-vbox')
                        .addClass('widget-hbox');
                }

                var readout = this.model.get('readout');
                if (readout) {
                    this.$readout.show();
                } else {
                    this.$readout.hide();
                }
            }
            return SelectionSliderView.__super__.update.apply(this);
        },
        
        events: {
            // Dictionary of events and their handlers.
            "slide": "handleSliderChange",
            "slidestop": "handleSliderChanged",
        }, 

        /**
         * Called when the slider value is changing.
         */
        handleSliderChange: function(e, ui) { 
            var actual_value = this._validate_slide_value(ui.value);
            var selected_label = this.model.get("_options_labels")[actual_value];
            this.$readout.text(selected_label);
            
            // Only persist the value while sliding if the continuous_update
            // trait is set to true.
            if (this.model.get('continuous_update')) {
                this.handleSliderChanged(e, ui);
            }            
        },
        
        /**
         * Called when the slider value has changed.
         *
         * Calling model.set will trigger all of the other views of the 
         * model to update.
         */
        handleSliderChanged: function(e, ui) {
            var actual_value = this._validate_slide_value(ui.value);
            var selected_label = this.model.get("_options_labels")[actual_value];
            this.$readout.text(selected_label);
            this.model.set('selected_label', selected_label, {updated_view: this});
            this.touch();
        },

        _validate_slide_value: function(x) {
            /**
             * Validate the value of the slider before sending it to the back-end
             * and applying it to the other views on the page.
             *
             * Double bit-wise not truncates the decimal (int cast).
             */
            return ~~x;
        },
    });    
    
    var MultipleSelectionModel = SelectionModel.extend({
        defaults: _.extend({}, SelectionModel.prototype.defaults, {
            _model_name: "MultipleSelectionModel",
            selected_labels: [],
        }),
    });

    var SelectMultipleModel = MultipleSelectionModel.extend({
        defaults: _.extend({}, MultipleSelectionModel.prototype.defaults, {
            _model_name: "SelectMultipleModel",
            _view_name: "SelectMultipleView",
        }),
    });

    var SelectMultipleView = SelectView.extend({
        render: function() {
            /**n
             * Called when view is rendered.
             */
            SelectMultipleView.__super__.render.apply(this);
            this.$el.removeClass('widget-select')
              .addClass('widget-select-multiple');
            this.$listbox.attr('multiple', true)
              .on('change', $.proxy(this.handle_change, this));

            // set selected labels *after* setting the listbox to be multiple selection
            this.$listbox.val(this.model.get('selected_labels'));
            return this;
        },

        update: function() {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been
             * changed by another view or by a state update from the back-end.
             */
            SelectMultipleView.__super__.update.apply(this, arguments);
            this.$listbox.val(this.model.get('selected_labels'));
        },

        handle_click: function() {
            /**
             * Overload click from select
             *
             * Apparently it's needed from there for testing purposes,
             * but breaks behavior of this.
             */
        },

        handle_change: function (e) {
            /**
             * Handle when a new value is selected.
             *
             * Calling model.set will trigger all of the other views of the
             * model to update.
             */

            // $listbox.val() returns a list of string.  In order to preserve
            // type information correctly, we need to map the selected indices
            // to the options list.
            var items = this.model.get('_options_labels');
            var values = Array.prototype.map.call(this.$listbox[0].selectedOptions || [], function(option) {
                return items[option.index];
            });

            this.model.set('selected_labels',
                values,
                {updated_view: this});
            this.touch();
        },
    });

    module.exports = {
        SelectionModel: SelectionModel,
        DropdownView: DropdownView,
        DropdownModel: DropdownModel,
        RadioButtonsView: RadioButtonsView,
        RadioButtonsModel: RadioButtonsModel,
        ToggleButtonsView: ToggleButtonsView,
        ToggleButtonsModel: ToggleButtonsModel,
        SelectView: SelectView,
        SelectModel: SelectModel,
        SelectionSliderView: SelectionSliderView,
        SelectionSliderModel: SelectionSliderModel,
        MultipleSelectionModel: MultipleSelectionModel,
        SelectMultipleView: SelectMultipleView,
        SelectMultipleModel: SelectMultipleModel,
    };