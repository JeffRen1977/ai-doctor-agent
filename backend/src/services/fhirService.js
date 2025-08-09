const FHIR = require('fhir-kit-client');

// You would typically store this in environment variables
const fhirClient = new FHIR({
  baseUrl: 'https://hapi.fhir.org/baseR4' // Using public HAPI FHIR test server
});

/**
 * Get all resources for a patient.
 * @param {string} patientId The patient's ID.
 * @returns {Promise<object[]>} A promise that resolves to an array of FHIR resources.
 */
async function getPatientRecords(patientId) {
  try {
    // This is a simple example. You can search for specific resources
    // like 'Observation', 'Condition', 'MedicationRequest', etc.
    const response = await fhirClient.search({
      resourceType: 'Patient',
      searchParams: { _id: patientId, _revinclude: '*' }
    });
    return response.entry || [];
  } catch (error) {
    console.error('Error fetching patient records from FHIR server:', error);
    throw new Error('Failed to fetch patient records.');
  }
}

module.exports = {
  getPatientRecords
};
