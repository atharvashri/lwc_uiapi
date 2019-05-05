import { LightningElement, wire, track } from 'lwc';
import { getRecordCreateDefaults, createRecord, getRecordUi, updateRecord } from 'lightning/uiRecordApi';
import { getListUi } from 'lightning/uiListApi';
//import { CurrentPageReference } from 'lightning/navigation';
import { registerListener } from 'c/pubsub';
//
import utils from 'c/utils'
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

//input params 
//recordid , objectApiName, mode, form factor , recordTypeId

import CURRENT_OBJECT from '@salesforce/schema/Account';


export default class Viewer extends LightningElement {

    // @api mode;
    // @api formFactor;
    // @api recordid;
    // @api objectApiName;
    @track test = 'abc';
    @track mode = 'Create';
    recordid = '006O000000CfXmIIAV';

    @wire(getRecordUi, { recordIds: '$recordid', layoutTypes: 'Full', modes: '$mode' })
    recordUi;


    @track isViewerStared = true
    @track layout;
    @track pickListValues;
    @track apiname = CURRENT_OBJECT.objectApiName;


    modeInfo = {
        isEditMode: false,
        isCreateMode: false,
        isViewMode: false
    }
    recordDefault;

    //@wire(CurrentPageReference) pageRef;

    @wire(getRecordCreateDefaults, { objectApiName: CURRENT_OBJECT })
    default;
 

    @wire(getPicklistValuesByRecordType, { objectApiName: CURRENT_OBJECT, recordTypeId: '012000000000000AAA' })
    defaultPicklist

    @wire(getListUi, { objectApiName: CURRENT_OBJECT})
    propertyOrFunction;

    connectedCallback() {
        registerListener(
            'formValueschange',
            this.changeDetect,
            this
        );
    }

    initialize() {

        switch (this.mode) {
            case 'Create':
                /* eslint-disable no-console */
                console.log(CURRENT_OBJECT);
                console.log(this.default);
                console.log(this.propertyOrFunction);
                if (this.default.data !== undefined) {
                    this.modeInfo.isCreateMode = true;
                    console.log(this.defaultPicklist.data);
                    this.recordDefault = utils.getLayoutModelForDefaults(this.default.data, this.defaultPicklist.data);
                    /* eslint-disable no-console */

                    console.log(this.default.data);
                    console.log(this.recordUi);
                    console.log(this.recordDefault);

                    this.layout = this.recordDefault.layouts.Full[this.mode]
                    /* eslint-enable no-console */

                }

                break;

            case 'Edit':
                if (this.recordUi.data !== undefined) {
                    this.modeInfo.isEditMode = true;
                    this.recordDefault = utils.getLayoutModel(this.recordid, this.recordUi.data, this.defaultPicklist.data);
                    /* eslint-disable no-console */

                    console.log(this.recordDefault);

                    this.layout = this.recordDefault.layouts.Full[this.mode]
                    /* eslint-enable no-console */

                }

                break;

            case 'View':
                this.modeInfo.isViewMode = true;
                if (this.default.data !== undefined) {
                    this.recordDefault = utils.getLayoutModel(this.recordid, this.recordUi.data, this.defaultPicklist.data);
                    /* eslint-disable no-console */
                    console.log(this.recordDefault);

                    this.layout = this.recordDefault.layouts.Full[this.mode]
                }
                /* eslint-enable no-console */
                break;

            default:
                break;
        }
    }

    areDetailsVisible() {
        return true;
    }

    changeDetect(evt) {
        /* eslint-disable no-console */
        console.log(evt);

        evt.target.id = evt.target.id.split('-')[0];


        switch (evt.target.type) {
            case "checkbox":
                console.log(evt.target.type);
                this.recordDefault.editValues[evt.target.id] = evt.target.checked
                break;

            default:
                if (this.recordDefault.editValues[evt.target.id] !== undefined) {
                    this.recordDefault.editValues[evt.target.id] = evt.target.value;
                }
                break;
        }
        console.log(this.recordDefault.editValues);
    }

    saveRecord() {

        let fields = { ...this.recordDefault.editValues };

        for (let propName in fields) {
            if (fields[propName] === null || fields[propName] === undefined) {
                delete fields[propName];
            }
        }


        const recordInput = { apiName: CURRENT_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then(account => {

                this.accountId = account.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: this.apiname + ' is created with id ' + this.accountId,
                        variant: 'success'
                    })
                );
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error,
                        variant: 'error'
                    })
                );
            });

    }


    updateRecord() {

        let fields = { ...this.recordDefault.editValues };

        for (let propName in fields) {
            if (fields[propName] === null || fields[propName] === undefined) {
                delete fields[propName];
            }
        }

        if (this.recordid !== null && this.recordid !== undefined) {
            fields.Id = this.recordid;
            const recordInput = { fields };
            updateRecord(recordInput)
                .then(account => {
                    this.accountId = account.id;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: this.apiname + ' is updated',
                            variant: 'success'
                        })
                    );
                })
                .catch((error) => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error updating record',
                            message: error,
                            variant: 'error'
                        })
                    );
                });
        }
    }
}