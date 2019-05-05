import { LightningElement, api, track } from 'lwc';
import { fireEvent } from 'c/pubsub';
import makeApiCall from '@salesforce/apex/UiApiController.makeApiCall'
//import { CurrentPageReference } from 'lightning/navigation';

export default class FieldComponent extends LightningElement {

    @api recordfieldcmp;
    @api modeinfo;
    ACCOUNT_OBJECT

    @api apiname
    @track recordfield;

    //@wire(CurrentPageReference) pageRef;
    
    @track isValueEdited = false;
    @track recordType = {
        isReference: false,
        isTextArea: false,
        isPickList: false,
        ischeckBox: false,
    }

    connectedCallback() {
        this.recordfield = {...this.recordfieldcmp}
        if (this.recordfield.displayValue != null) {
            this.isValueEdited = true;
        }
        if(this.recordfield.fieldInfo.dataType === "Reference")
            this.getReferences(this.recordfield);
    }

    changeDetect(evt) {
        fireEvent(this.pageRef,'formValueschange', evt);
    }

    getReferences(recordfield){

        // let lookups = recordfield.fieldInfo.referenceToInfos;

        // let lookupPromises = []

        // lookups.forEach(element => {
        //     lookupPromises.push(makeApiCall(element));
        // }); 
        
        // Promise.all(lookupPromises).then((data)=>{

        // });

        //writing it for a single lookup only for now.
        
        makeApiCall({objectApi:this.apiname, targetId: this.recordfield.fieldInfo.apiName}).then((data)=>{
            /* eslint-disable no-console */
            let lookUpData = JSON.parse(data);
            console.log(lookUpData);

            //need to put referenceToInfos in for each loop as doing it for only one lookup skipping for now
            recordfield.record = lookUpData.lookupResults[this.recordfield.fieldInfo.referenceToInfos[0].apiName].records.filter(element => element.fields.Id.value !== this.recordfield.displayValue);

            /* eslint-enable no-console */
        }).catch((er)=>{
             /* eslint-disable no-console */
             console.log(er);
             /* eslint-enable no-console */
        })
    }
}