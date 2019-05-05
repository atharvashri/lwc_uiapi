const getLayoutItemModel = function (objectInfo, record, recordType, item) {

  let result = {};
  result.label = item.label;

  let values = [];
  let linkId;
  let linkText;
  let customLinkUrl;
  let customText;

  (item.layoutComponents || []).forEach((component) => {

    // Component display info.
    if (component.componentType === 'Field') {
      let compValue = component.apiName;
      let fieldInfo = objectInfo.fields[compValue];

      // Reference link.
      if (fieldInfo && fieldInfo.reference) {
        // The relationship may be absent if it amounts to null.
        if (record.fields[fieldInfo.relationshipName]) {
          let relatedData = record.fields[fieldInfo.relationshipName].value
          if (relatedData) {
            linkId = relatedData.fields.Id.value
            linkText = relatedData.fields.Name.value
          }
        }
      }

      if (fieldInfo && (fieldInfo.type === 'Datetime' || fieldInfo.type === 'DateOnly')) {
        let currValue = record.fields[compValue].value;
        let formattedData = new Date(currValue);
        values.push(
          {
            displayValue: formattedData,
            value: currValue,
            label: component.label,
            field: compValue,
            fieldInfo,
            editableForNew: item.editableForNew,
            editableForUpdate: item.editableForUpdate,
            required: item.required,
            isNull: currValue === null
          });
      } else if (record.fields[compValue]) {
        let displayValue = record.fields[compValue].displayValue;
        let rawValue = record.fields[compValue].value;
        if (displayValue === null && rawValue != null) {
          displayValue = rawValue.toString();
        }
        values.push(
          {
            displayValue: displayValue,
            value: rawValue,
            label: component.label,
            field: compValue,
            fieldInfo,
            editableForNew: item.editableForNew,
            editableForUpdate: item.editableForUpdate,
            required: item.required,
            isNull: displayValue === null
          })
      } else {
        /* eslint-disable no-console */
        console.log('Missing expected field: ' + compValue);
        /* eslint-enable no-console */
      }

    } else if (component.componentType === 'CustomLink') {
      customLinkUrl = component.customLinkUrl;
      linkText = component.label;
    } else if (component.componentType === 'Canvas') {
      customText = 'Canvas: ' + component.apiName;
    } else if (component.componentType === 'EmptySpace') {
      customText = '';
    } else if (component.componentType === 'VisualforcePage') {
      customText = 'VF Page: ' + component.apiName;
    } else if (component.componentType === 'ReportChart') {
      customText = 'Report Chart: ' + component.apiName;
    }
  });

  result.values = values;
  result.linkId = linkId;
  result.linkText = linkText;
  result.customLinkUrl = customLinkUrl;
  result.customText = customText;

  return result;
}

const getLayoutRowModel = function (objectInfo, record, recordType, itemsIn) {
  let items = [];
  let result = {
    items: items
  };

  (itemsIn || []).forEach((item) => {
    items.push(this.getLayoutItemModel(objectInfo, record, recordType, item));
  });


  return result;
}

const getLayoutSectionModel = function (objectInfo, record, recordType, section) {
  let result = {};
  result.heading = section.heading;
  result.useHeading = (section.useHeading) ? section.useHeading : false;

  let rows = [];
  (section.layoutRows || []).forEach((row) => {
    rows.push(this.getLayoutRowModel(objectInfo, record, recordType, row.layoutItems));
  });

  result.rows = rows;
  return result;
}

const getLayoutModelForDefaults = function (defaults, defaultPickList) {
  let objectInfo = {}
  if (defaults.objectInfo) {
    // in case of clone
    objectInfo = defaults.objectInfo
  } else {
    // in case of create
    objectInfo = defaults.objectInfos[defaults.record.apiName];
  }
  let record = defaults.record;
  let layout = defaults.layout;

  let recordType = '012000000000000AAA'; // 'Master'
  if (record.recordTypeInfo) {
    recordType = record.recordTypeInfo.recordTypeId;
  }

  let layouts = {};
  let editValues = {};

  try {
    let modeType = layout.mode;
    let layoutType = layout.layoutType;

    layouts[layoutType] = {};

    const sections = layout.sections.map((section) => this.getLayoutSectionModel(objectInfo, record, recordType, section));

    layouts[layoutType][modeType] = this.layoutBuilder(sections, defaultPickList, editValues, modeType);

    let result = {
      layouts,
      editValues,
      objectInfo,
      apiName: objectInfo.apiName
    };
    return result;

  } catch (err) {
    /* eslint-disable no-console */
    console.log('ERROR CREATING DEFAULTS LAYOUT MODEL ' + err);
    /* eslint-enable no-console */
    return { layouts: [], editValues: {}, objectInfo: {}, apiName: null };
  }
}

const getLayoutModel = function (recordId, recordView, defaultPickList) {
  let record = recordView.records[recordId];
  let apiName = record.apiName;
  let entityEntry = recordView.layouts[apiName];
  let objectInfo = recordView.objectInfos[apiName];

  let recordType = '012000000000000AAA'; // 'Master'
  if (record.recordTypeInfo) {
    recordType = record.recordTypeInfo.recordTypeId;
  }

  let layouts = {};
  let editValues = {};

  try {
    let recordTypeRep = entityEntry[Object.keys(entityEntry)[0]]; // TODO: support multiple record types.
    for (const layoutType of Object.keys(recordTypeRep)) {
      let layoutTypeRep = recordTypeRep[layoutType];
      for (const modeType of Object.keys(layoutTypeRep)) {
        let layoutRep = layoutTypeRep[modeType];
        if (!layouts[layoutType]) {
          layouts[layoutType] = {};
        }

        const sections = layoutRep.sections.map((section) => this.getLayoutSectionModel(objectInfo, record, recordType, section));
        layouts[layoutType][modeType] = this.layoutBuilder(sections, defaultPickList, editValues, modeType);
      }
    }

    let result = {
      layouts,
      editValues,
      objectInfo,
      recordId: record.id,
      record
    };

    /* eslint-disable no-console */
    console.log(result);
    /* eslint-enable no-console */
    return result;

  } catch (err) {
    /* eslint-disable no-console */
    console.log('ERROR CREATING LAYOUT MODEL ' + err);
    /* eslint-enable no-console */
    return { layouts: [], editValues: {}, objectInfo: {}, recordId: null, record: null };
  }
}


const layoutBuilder = function (sections, defaultPickList, editValues, mode) {
  sections.forEach((section, sectionIndex) =>
    section.rows.forEach((row, rowIndex) => {
      section.rows[rowIndex].id = sections[sectionIndex].heading + rowIndex;
      row.items.forEach((item, itemIndex) => {
        item.values.forEach((value, valueIndex) => {

          switch (section.rows[rowIndex].items[itemIndex].values[valueIndex].fieldInfo.dataType) {
            case 'Email':
            case 'Currency':
            case 'Int':
            case 'String':
            case 'Phone':
            case "TextArea":
            case "Url":
            case "Percent":
              if (section.rows[rowIndex].items[itemIndex].values[valueIndex].text === undefined) {
                section.rows[rowIndex].items[itemIndex].values[valueIndex].text = true;
              }
              break;
            case 'Boolean':
              if (section.rows[rowIndex].items[itemIndex].Boolean === undefined) {
                section.rows[rowIndex].items[itemIndex].values[valueIndex].Boolean = true;
              }
              break;
            case 'Picklist':
              if (mode === 'Edit' || mode === 'Create') {
                if (section.rows[rowIndex].items[itemIndex].values[valueIndex].Picklist === undefined) {
                  section.rows[rowIndex].items[itemIndex].values[valueIndex].Picklist = true;

                  if (defaultPickList.picklistFieldValues[section.rows[rowIndex].items[itemIndex].label] !== undefined) {
                    section.rows[rowIndex].items[itemIndex].values[valueIndex].pickValues = defaultPickList.picklistFieldValues[section.rows[rowIndex].items[itemIndex].label].values;
                  }
                  else {
                    section.rows[rowIndex].items[itemIndex].values[valueIndex].pickValues = defaultPickList.picklistFieldValues[section.rows[rowIndex].items[itemIndex].values[valueIndex].field].values;
                  }

                  if (section.rows[rowIndex].items[itemIndex].values[valueIndex].displayValue !== null) {
                    section.rows[rowIndex].items[itemIndex].values[valueIndex].pickValues = section.rows[rowIndex].items[itemIndex].values[valueIndex].pickValues.filter((element) => { return section.rows[rowIndex].items[itemIndex].values[valueIndex].displayValue !== element.value })
                  }
                }
              }
              if (mode === 'View') {
                section.rows[rowIndex].items[itemIndex].values[valueIndex].Picklist = true;
              }

              break;
            case 'DateTime':
            case 'Reference':
              if (section.rows[rowIndex].items[itemIndex].values[valueIndex].Reference === undefined) {
                section.rows[rowIndex].items[itemIndex].values[valueIndex].Reference = true;
                if (section.rows[rowIndex].items[itemIndex].values[valueIndex].displayValue !== null) {
                  section.rows[rowIndex].items[itemIndex].values[valueIndex].linkText = section.rows[rowIndex].items[itemIndex].linkText;
                }
              }
              break;
            case 'Date':
              if (section.rows[rowIndex].items[itemIndex].values[valueIndex].isDate === undefined) {
                section.rows[rowIndex].items[itemIndex].values[valueIndex].isDate = true;
              }
              break;
            default:
              break;
          }

          //check for editableForUpdate and editableForNew and write the conditions
          if (section.rows[rowIndex].items[itemIndex].values[valueIndex].editableForUpdate && mode === 'Edit') {
            editValues[value.field] = value.value;
          }

          if (section.rows[rowIndex].items[itemIndex].values[valueIndex].editableForNew && mode === 'Create') {
            editValues[value.field] = value.value;
          }
        })
      })
    }));

  return sections;
}

export {
  getLayoutItemModel,
  getLayoutModel,
  getLayoutSectionModel,
  getLayoutRowModel,
  getLayoutModelForDefaults,
  layoutBuilder
}
