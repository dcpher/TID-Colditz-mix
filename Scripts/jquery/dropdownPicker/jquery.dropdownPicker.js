(function ($) {
    $.fn.extend({
        dropdownPicker: function ($pickerAddButton, $hiddenSelectedItemsInput, $selectedItemsElement, opt) {
            opt = $.extend({
                cantFindItemErrorMessage: "Sorry, we don't recognise this: (#{item}). Please try again.",
                pickerInputClass: "pickerInput",
                destinationInputClass: "",
                hiddenInputItemDelimiter: "|",
                aliasDelimiter: "|",
                hiddenInputAliasDelimiter: ":",
                addedItemListItemTemplate: function (item) {
                    return utils.sub("#{name}#{aliasOrBlank}<a>&times;</a>", {
                        name: item['name'],
                        aliasOrBlank: item['matchedAlias'] ? utils.sub(' (#{alias}) ', { alias: item['matchedAlias'] }) : ' '
                    });
                },
                insertError: function (errorMessage, input, fieldIdentifier) {
                    var error = $(utils.sub("<ul class='input-validation-errors'><li><span>#{message}</span></li></ul>", {
                        message: errorMessage
                    }));
                    error.insertAfter(input).hide().fadeIn();
                    return error;
                }
            }, opt);

            var utils = {
                itemsFromOptions: function (options) {
                    return $.map(options, function (option) {
                        return {
                            'id': option.value,
                            'name': option.text,
                            'sort': Number(option.getAttribute('data-sort')),
                            'aliases': (option.getAttribute('data-aliases')
                                ? option.getAttribute('data-aliases').split(opt.aliasDelimiter)
                                : null)
                        };
                    });
                },
                getItemByID: function (id, items) {
                    for (var i = 0; i < items.length; i++) {
                        if (items[i]['id'] == id) {
                            return items[i];
                        }
                    }
                    return null;
                },
                isItemInHiddenInput: function (itemToFind) {
                    return ($.grep(utils.readFromHiddenInput(), function (item) {
                        return item['id'] == itemToFind['id'];
                    }).length > 0);
                },
                addItemToHiddenInput: function (itemToAdd) {
                    var hiddenItemsData = utils.readFromHiddenInput();

                    hiddenItemsData.push({ 'id': itemToAdd['id'], 'alias': itemToAdd['matchedAlias'] });
                    utils.writeOutToHiddenInput(hiddenItemsData);
                },
                readFromHiddenInput: function () {
                    var items = [];
                    var hiddenItemsData = $hiddenSelectedItemsInput.val();

                    if (hiddenItemsData.length > 0) {
                        $.each(hiddenItemsData.split(opt.hiddenInputItemDelimiter), function (i, hiddenItemsDataItem) {
                            var split = hiddenItemsDataItem.split(opt.hiddenInputAliasDelimiter);
                            items.push({ 'id': Number(split[0]), 'alias': split[1] || null });
                        });
                    }

                    return items;
                },
                writeOutToHiddenInput: function (items) {
                    $hiddenSelectedItemsInput.val($.map(items, function (item) {
                        if (item['alias']) {
                            return item['id'] + opt.hiddenInputAliasDelimiter + item['alias'];
                        } else {
                            return item['id'];
                        }
                    }).join(opt.hiddenInputItemDelimiter));
                },
                removeItemFromHiddenInput: function (itemToRemove) {
                    utils.writeOutToHiddenInput($.grep(utils.readFromHiddenInput(), function (item) {
                        return item['id'] != itemToRemove['id'];
                    }));
                },
                sub: function (html, values) {
                    return html.replace(/#\{(\w*)\}/g, function (token, key) {
                        return values[key] || token;
                    });
                }
            };

            return this.each(function () {

                var $this = $(this);
                var destinationsPlaceholderText;

                $this
                    .on("init.picker", function () {
                        $hiddenSelectedItemsInput.removeAttr('disabled');
                        $this.attr('disabled', 'disabled');

                        var $options = $this.children().toArray();
                        destinationsPlaceholderText = $($options.shift()).text();
                        var itemsWithAliases = utils.itemsFromOptions($options);

                        var $pickerInput = $("<input/>", {
                            'type': 'text',
                            'class': opt.pickerInputClass
                        });
                        $this.hide().after($pickerInput);
                        $pickerAddButton.remove();

                        $selectedItemsElement.empty();

                        $.each(utils.readFromHiddenInput(), function (i, itemFromHiddenInput) {
                            var item = $.extend(utils.getItemByID(itemFromHiddenInput['id'], itemsWithAliases), { 'matchedAlias': itemFromHiddenInput['alias'] });

                            if (item) {
                                $this.trigger('displayItem.where', [item, true]);
                            }
                        });

                        $pickerInput
                            .placeholderPlus(destinationsPlaceholderText)
                            .autocomplete(itemsWithAliases)
                            .on('itemChosen', function (e, item, textUserEntered, selectedListItem) {
                                if (selectedListItem) {
                                    $this.trigger('logToAnalytics', ["Item - Selected an autocomplete item", 'I - ' + selectedListItem.text() + ' - ' + textUserEntered]);
                                }

                                $this.trigger('addItem.where', [item]);
                                $pickerInput.val('');
                            })
                            .on('findingExactMatchesFor', function (e, text, triggeringAction) {
                                $this.trigger('logToAnalytics', ["Item - Return or tab on input no autocomplete", 'I - ' + text]);
                            })
                            .on('errorFeedback.autocomplete', function (e, type, details) {
                                $this.trigger('logToAnalytics', ['Item - Failed on exact match', 'I - ' + details.join(', ').toLowerCase()]);
                                $this.trigger('couldNotFindItemsError', [details]);
                            })
                            .on('focus', function () {
                                $this.trigger('removeError', [$pickerInput]);
                            });

                        $this.data('pickerInput', $pickerInput);
                        $this.trigger('addListeners.where');
                    })
                    .on('addItem.where', function (e, item) {
                        if (utils.isItemInHiddenInput(item)) {
                            $this.trigger('logToAnalytics', ["Item - Tried to re-add item", 'I - ' + item['name']]);
                        } else {
                            utils.addItemToHiddenInput(item);
                            $this.trigger('displayItem.where', [item]);
                            $this.trigger('logToAnalytics', ["Item - Added item", 'I - ' + item['name']]);
                        }
                    })
                    .on('displayItem.where', function (e, item, noAnimation) {
                        $('<li/>')
                        .html(opt.addedItemListItemTemplate(item))
                        .data('itemData', item)
                        .appendTo($selectedItemsElement)
                        .hide()
                        .fadeIn(noAnimation ? 0 : 500);
                    })
                    .on('addListeners.where', function () {
                        // Listen for clicks on the remove link in the destination list, and remove countries as required
                        $selectedItemsElement
                            .on('click', 'a', function () {
                                var item = $(this).closest('li');
                                utils.removeItemFromHiddenInput(item.data('itemData'));
                                $this.trigger('logToAnalytics', ["Item - Removed item", 'I - ' + item.data('itemData')['name']]);
                                item.remove();
                            });
                    })

                    .on('logToAnalytics', function (e, action, label, value) {
                        if (typeof googleAnalytics !== 'undefined') {
                            googleAnalytics.trackEvent('Item Picker', action, { 'label': label, 'value': value });
                        }
                    })
                    .on('couldNotFindItemsError', function (e, items) {
                        var itemsForError = items.join(', ');

                        var errorMessage = utils.sub(opt.cantFindItemErrorMessage, {
                            item: itemsForError
                        });

                        $this.trigger('displayError', [$this.data('pickerInput'), errorMessage, 'item']);
                        $this.data('pickerInput').val('').blur();
                    })
                    .on('displayError', function (e, input, message, fieldIdentifier) {
                        $this.trigger('removeError', [input]);
                        var error = opt.insertError(message, input, fieldIdentifier);
                        input.data('error', error);
                    })
                    .on('removeError', function (e, input) {
                        if (input.data('error')) {
                            input.data('error').remove();
                            input.removeData('error');
                        }
                    });

                $this.trigger("init.picker");
            });
        }
    });
})(jQuery);