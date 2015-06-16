/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
define([
    "uiRegistry",
    "jquery",
    "underscore",
    "Magento_Ui/js/modal/modal",
    "mage/backend/notification"
], function (uiRegistry, $, _) {
    "use strict";
    var stepComponents;
    var getStep = _.memoize(function(step) {
        return _.findWhere(stepComponents, {name: step});
    });
    var Wizard = function (steps, element) {
        this.steps = steps;
        this.index = 0;
        this.data = {};
        this.element = element;
        $(this.element).notification();
        this.move = function (newIndex) {
            if (newIndex > this.index) {
                this._next(newIndex);
            } else if (newIndex < this.index) {
                this._prev(newIndex);
            }
        };
        this._next = function () {
            try {
                this.getStep().force(this);
            } catch (e) {
                this.notifyMessage(e.message, true);
                throw new Error(e);
            }
            this.index++;
            this.render();
        };
        this.getStep = function() {
            return getStep(this.steps[this.index]);
        };
        this._prev = function (newIndex) {
            this.getStep().back(this);
            this.index = newIndex;
        };
        this.notifyMessage = function (message, error) {
            $(this.element).notification('clear').notification('add', {
                error: error,
                message: $.mage.__(message)
            });
        };
        this.render = function() {
            $(this.element).notification('clear');
            this.getStep().render(this);
        };
    };

    $.widget('mage.step-wizard', $.ui.tabs, {
        wizard: undefined,
        options: {
            collapsible: false,
            disabled: [],
            event: "click",
            buttonNextElement: '[data-role="step-wizard-next"]',
            buttonPrevElement: '[data-role="step-wizard-prev"]',
            buttonFinalElement: '[data-role="step-wizard-final"]',
            stepRegistryComponent: null,
            steps: null
        },
        _create: function () {
            this._control();
            this._super();
            this.options.beforeActivate = this._handlerStep.bind(this);
        },
        _control: function () {
            var self = this;
            this.prev = this.element.find(this.options.buttonPrevElement);
            this.next = this.element.find(this.options.buttonNextElement);
            this.final = this.element.find(this.options.buttonFinalElement);

            this.next.on('click.' + this.eventNamespace, function (event) {
                self._activate(self.options.active + 1);
            });
            this.prev.on('click.' + this.eventNamespace, function (event) {
                self._activate(self.options.active - 1);
            });
            this.final.hide();
        },
        load: function (index, event) {
            this._disabledTabs(index);
            this._actionControl(index);
            this._super(index, event);
        },
        _handlerStep: function (event, ui) {
            try {
                var index = this.tabs.index(ui.newTab[0]);
                var tab = this.panels.eq(index);
                var steps =  uiRegistry.async(this.options.stepRegistryComponent);

                steps(function(component) {
                    if (this.wizard === undefined) {
                        this.wizard = new Wizard(this.options.steps, tab);
                        stepComponents = component.steps;
                    }
                    this.wizard.move(index);
                }.bind(this));
            } catch (e) {
                return false;
            }
        },
        _way: function (index) {
            return this.options.selected > index ? 'back' : 'force';
        },
        _actionControl: function (index) {
            if (index < 1) {
                this.prev.find('button').addClass("disabled");
            }
            if (index === 1 && this._way(index) === 'force') {
                this.prev.find('button').removeClass("disabled");
            }
            if (index > this.tabs.length - 2) {
                this.next.hide();
                this.final.show();
            }
            if (this._way(index) === 'back') {
                this.final.hide();
                this.next.show();
            }
        },
        _disabledTabs: function (index) {
            this._setupDisabled(_.range(index + 2, this.tabs.length));
        }
    });
    $(document).ready(function () {
        $('[data-role=step-wizard-dialog]').modal({
            type: 'slide',
            title: $.mage.__('Create Product Configurations'),
            buttons: []
        });
        $('[data-action=open-steps-wizard]').on('click', function() {
            $('[data-role=step-wizard-dialog]').trigger('openModal');
        });
    });

    return $.mage["step-wizard"];

});
