import { Component, OnDestroy, Input, Output, EventEmitter, Type, ElementRef, HostBinding, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { ModalInstance, ModalResult } from './modal-instance';

@Component({
    selector: 'modal',
    host: {
        'class': 'modal',
        'role': 'dialog',
        'tabindex': '-1'
    },
    template: `
        <div class="modal-dialog" [ngClass]="getCssClasses()">
            <div class="modal-content">
                <ng-content></ng-content>
            </div>
        </div>
        <div class="modal fade" #alertPopup>
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">{{ hideAlertHeader }}</h4>
                    </div>
                    <div class="modal-body">
                        <p>{{ hideAlertText }}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" (click)="alertPopupInstance.dismiss()">{{ hideAlertDismissBtnText }}</button>
                        <button type="button" class="btn btn-danger" (click)="alertPopupInstance.close()">{{ hideAlertCloseBtnText }}</button>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ModalComponent implements AfterViewInit, OnDestroy {

    private overrideSize: string = null;

    instance: ModalInstance;
    alertPopupInstance: ModalInstance;
    visible: boolean = false;
    isAlerting: boolean = false;

    @ViewChild('alertPopup') alertPopup: ElementRef;

    @Input() animation: boolean = true;
    @Input() backdrop: string | boolean = true;
    @Input() keyboard: boolean = true;
    @Input() size: string;
    @Input() cssClass: string = '';
    @Input() hideCondition: boolean | Function = false;
    @Input() hideAlertHeader: string = 'Wait!';
    @Input() hideAlertText: string = 'Are you sure?';
    @Input() hideAlertDismissBtnText = 'No';
    @Input() hideAlertCloseBtnText = 'Yes';

    @Output() onClose: EventEmitter<any> = new EventEmitter(false);
    @Output() onDismiss: EventEmitter<any> = new EventEmitter(false);
    @Output() onOpen: EventEmitter<any> = new EventEmitter(false);

    @HostBinding('class.fade') get fadeClass(): boolean {
        return this.animation;
    }

    @HostBinding('attr.data-keyboard') get dataKeyboardAttr(): boolean {
        return this.keyboard;
    }

    @HostBinding('attr.data-backdrop') get dataBackdropAttr(): string | boolean {
        return this.backdrop;
    }

    constructor(protected element: ElementRef) {
        this.instance = new ModalInstance(this.element);

        this.instance.hidden.subscribe((result) => {
            this.visible = this.instance.visible;
            if (result === ModalResult.Dismiss) {
                this.onDismiss.emit(undefined);
            }
        });

        this.instance.shown.subscribe(() => {
            this.onOpen.emit(undefined);
        });

        this.instance.hide.subscribe((event) => {
            if (this.isAlerting) {
                // for some reason displaying the alert pop-up causes another 'hide' event to be triggered
                // in this case, just short-circuit the event
                event.preventDefault();
                event.stopImmediatePropagation;
                return false;
            }
            const shouldShowPopup = (
                (typeof this.hideCondition === 'boolean') ? this.hideCondition :
                (typeof this.hideCondition === 'function') ? this.hideCondition() :
                false
                );
            if (shouldShowPopup && this.alertPopupInstance.result !== ModalResult.Close) {
                event.preventDefault();
                event.stopImmediatePropagation;
                this.alertPopupInstance.open();
                this.isAlerting = true;
                return false;
            }
            else {
                this.isAlerting = false;
                if (this.alertPopupInstance.result === ModalResult.Close) {
                    this.alertPopupInstance.result = ModalResult.None;
                }
            }
        });
    }

    ngAfterViewInit() {
        this.alertPopupInstance = new ModalInstance(this.alertPopup, '.alert-popup');

        this.alertPopupInstance.hidden.subscribe((result) => {
            this.isAlerting = false;
            this.alertPopupInstance.result = result;
            if (result === ModalResult.Close) {
                this.close();
                this.instance.removeBackdrop();
            }
        });
    }

    ngOnDestroy() {
        return this.instance && this.instance.destroy();
    }

    routerCanDeactivate(): any {
        return this.ngOnDestroy();
    }

    open(size?: string): Promise<void> {
        if (ModalSize.validSize(size)) this.overrideSize = size;
        return this.instance.open().then(() => {
            this.visible = this.instance.visible;
        });
    }

    close(value?: any): Promise<void> {
        return this.instance.close().then(() => {
            this.onClose.emit(value);
        });
    }

    dismiss(): Promise<void> {
        return this.instance.dismiss();
    }

    getCssClasses(): string {
        let classes: string[] = [];

        if (this.isSmall()) {
            classes.push('modal-sm');
        }

        if (this.isLarge()) {
            classes.push('modal-lg');
        }

        if (this.cssClass !== '') {
            classes.push(this.cssClass);
        }

        return classes.join(' ');
    }

    private isSmall() {
        return this.overrideSize !== ModalSize.Large
            && this.size === ModalSize.Small
            || this.overrideSize === ModalSize.Small;
    }

    private isLarge() {
        return this.overrideSize !== ModalSize.Small
            && this.size === ModalSize.Large
            || this.overrideSize === ModalSize.Large;
    }
}

export class ModalSize {
    static Small = 'sm';
    static Large = 'lg';

    static validSize(size: string) {
        return size && (size === ModalSize.Small || size === ModalSize.Large);
    }
}
