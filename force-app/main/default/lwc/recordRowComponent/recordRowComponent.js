import { LightningElement, api  } from 'lwc';
//import { CurrentPageReference } from 'lightning/navigation';

export default class RecordRowComponent extends LightningElement {

    @api layoutrow;
    @api modeinfo;
    @api apiname;

    //@wire(CurrentPageReference) pageRef;
}