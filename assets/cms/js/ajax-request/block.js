/* eslint-disable no-new, no-unused-vars, camelcase, new-cap, eqeqeq */
/* global ConcreteAjaxForm, ConcreteEvent, CCM_CID, Concrete, CCM_DISPATCHER_FILENAME, ConcreteToolbar, ConcreteAlert, ccmi18n */

/* Block ajax */
; (function (global, $) {
    'use strict'

    function ConcreteAjaxBlockForm($form, options) {
        var my = this
        options = $.extend({
            iframe: true,
            task: false,
            dragAreaBlockID: false,
            dragArea: null,
            bID: false,
            loader: true
        }, options)
        my.options = options

        if (options.dragAreaBlockID) {
            $form.find('input[name=dragAreaBlockID]').val(options.dragAreaBlockID)
        }

        ConcreteAjaxForm.call(my, $form, options)
        return $form
    }

    ConcreteAjaxBlockForm.prototype = Object.create(ConcreteAjaxForm.prototype)

    ConcreteAjaxBlockForm.prototype.before = function (my) {
        $.fn.dialog.showLoader()
        ConcreteEvent.fire('EditModeBeforeBlockSubmit', {
            form: my
        })
    }

    ConcreteAjaxBlockForm.prototype.refreshBlock = function (resp) {
        var my = this
        var cID = (resp.cID) ? resp.cID : CCM_CID
        var editor = new Concrete.getEditMode()
        var area = editor.getAreaByID(resp.aID)
        var arEnableGridContainer = area.getEnableGridContainer() ? 1 : 0
        var action = CCM_DISPATCHER_FILENAME + '/ccm/system/block/render'

        $.fn.dialog.closeTop()

        $.get(action, {
            arHandle: area.getHandle(),
            cID: cID,
            bID: resp.bID,
            arEnableGridContainer: arEnableGridContainer,
            placeholder: '',
            tempFilename: resp.tempFilename
        }, function (r) {
            var block; var edit_mode = Concrete.getEditMode(); var local_area = area.inEditMode(edit_mode)

            ConcreteToolbar.disableDirectExit()
            $.fn.dialog.hideLoader()

            if (my.options.task == 'add') {
                var $area = local_area.getElem(); var $elem = $(r)

                if (!$elem.hasClass('ccm-block-edit')) {
                    var found = $elem.find('.ccm-block-edit')
                    if (found.length) {
                        block = new Concrete.Block(found, edit_mode)
                        block.setArea(local_area)
                    }
                }

                if (!block) {
                    block = new Concrete.Block($elem, edit_mode)
                    block.setArea(local_area)
                }

                if (my.options.btHandle === 'core_area_layout') {
                    $area.children('.ccm-area-block-list').append($elem)
                } else {
                    var placeholder = $(my.options.placeholder)
                    if (placeholder.length) {
                        placeholder.replaceWith($elem)
                    } else {
                        $area.children('.ccm-area-block-list').prepend($elem)
                    }
                }

                ConcreteAlert.notify({
                    message: ccmi18n.addBlockMsg,
                    title: ccmi18n.addBlock
                })
                $.fn.dialog.closeAll()

                if (my.options.btSupportsInlineAdd) {
                    editor.destroyInlineEditModeToolbars()
                    ConcreteEvent.fire('EditModeExitInlineComplete', {
                        block: block
                    })
                }

                ConcreteEvent.fire('EditModeAddBlockComplete', {
                    block: block
                })
            } else {
                // remove old block from area
                block = local_area.getBlockByID(my.options.bID)
                var newBlock = block.replace(r)
                ConcreteAlert.notify({
                    message: ccmi18n.updateBlockMsg,
                    title: ccmi18n.updateBlock
                })

                if (my.options.btSupportsInlineEdit) {
                    editor.destroyInlineEditModeToolbars()
                    ConcreteEvent.fire('EditModeExitInlineComplete', {
                        block: newBlock
                    })
                }

                ConcreteEvent.fire('EditModeUpdateBlockComplete', {
                    block: newBlock
                })
            }
        })
    }

    ConcreteAjaxBlockForm.prototype.success = function (resp, my) {
        var form = my.$form[0]
        if (resp.newbID && form) {
            // Replace old block id in form action
            var actionURL = form.action
            var bIDParam = actionURL.substring(actionURL.indexOf('&bID='))
            var newActionURL = actionURL.replace(bIDParam, '&bID=' + resp.newbID)
            $(form).attr('action', newActionURL)
        }
        if (my.options.progressiveOperation) {
            my.handleProgressiveOperation(resp, function (r) {
                my.refreshBlock(r)
            })
        } else if (my.validateResponse(resp)) {
            my.refreshBlock(resp)
        }
    }

    // jQuery Plugin
    $.fn.concreteAjaxBlockForm = function (options) {
        return $.each($(this), function (i, obj) {
            (() => new ConcreteAjaxBlockForm($(this), options))()
        })
    }

    global.ConcreteAjaxBlockForm = ConcreteAjaxBlockForm
})(global, jQuery)
