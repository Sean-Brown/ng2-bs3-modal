import { Component, ViewChild, Input, ElementRef } from '@angular/core';
import { ModalComponent } from './modal';
import { AlertPopupComponent } from './alert-popup';

@Component({
    selector: 'modal-with-alert',
    template: `
        <div class="modal-dialog" [ngClass]="getCssClasses()">
            <div class="modal-content">
                <ng-content></ng-content>
            </div>
        </div>
        <alert-popup [alertText]="hideAlertText" #alertPopup></alert-popup>
    `
})
export class ModalAlertComponent extends ModalComponent {
    @ViewChild('alertPopup') alertPopup: AlertPopupComponent;
    @Input() hideCondition: boolean | Function = false;
    @Input() hideAlertText: string = '';

    constructor(protected element: ElementRef) {        
        super(element);
        this.instance.hide.subscribe((event) => {
            const shouldShowPopup = (
                (typeof this.hideCondition === "boolean") ? this.hideCondition :
                (typeof this.hideCondition === "function") ? this.hideCondition() :
                false
                );
            if (shouldShowPopup && !confirm(this.hideAlertText)) {
                event.preventDefault();
                event.stopImmediatePropagation;
                return false;
            }
        });
    }

}
