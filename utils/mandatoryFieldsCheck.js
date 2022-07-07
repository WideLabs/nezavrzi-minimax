const itemMandatoryFieldsCheck = (item) => {
    let mandatoryFields = ["Code", "Name", "Price"]
    let missingFields = []
    for(let i = 0; i < mandatoryFields.length; i++) {
        const currentField = mandatoryFields.at(i)
        if(!item[currentField]) {
            missingFields.push(currentField)
        }
    }
    return missingFields
}

const customerMandatoryFieldsCheck = (customer) => {
    let mandatoryFields = ["Code", "Name", "Address", "PostalCode", "City"]
    if(customer.SubjectToVAT !== "N") {
        mandatoryFields.push("VATIdentificationNumber")
    }
    let missingFields = []
    for(let i = 0; i < mandatoryFields.length; i++) {
        const currentField = mandatoryFields.at(i)
        if(!customer[currentField]) {
            missingFields.push(currentField)
        }
    }
    return missingFields
}

module.exports = {
    itemMandatoryFieldsCheck,
    customerMandatoryFieldsCheck
}