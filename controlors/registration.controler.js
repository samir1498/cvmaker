const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();

const addRegistration = async (req, res, next) => {
    try {
        const { IDstudent, date, Idprogram } = req.body.data;

        // Check if the necessary data is provided
        if (!IDstudent || !date || !Idprogram) {
            return res.send({
                message: "Error! There is missing data.",
                code: 400
            });
        }

        // Check if the student is already registered for the program
        const existingRegistration = await db.registration.findOne({
            where: {
                StudentID: IDstudent,
                progID: Idprogram
            }
        });

        if (existingRegistration) {
            return res.send({
                message: "Error! The student is already registered for this program.",
                code: 409 // Conflict
            });
        }

        // Creating a new class record in the database
        const newregistration = await db.registration.create({
            dateInscription: date,
            progID: Idprogram,
            StudentID: IDstudent
        });

        return res.send({
            message: `The registration has been added successfully.`,
            classId: newregistration.ID_ROWID,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the registration.",
            error: error.message,
            code: 400
        });
    }
};


/**
 * Delete a registration from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */

const removeRegistration = async (req, res, next) => {
    try {
        const registrationId = req.params.id; // Assuming the registration ID is passed as a parameter in the URL

        if (!registrationId) {
            return res.status(400).json({
                message: "Error! Registration ID is required for deletion.",
                code: 400
            });
        }

        const deletedRegistration = await db.registration.destroy({
            where: { ID_ROWID: registrationId }
        });

        if (!deletedRegistration) {
            return res.status(404).json({
                message: "Error! Registration not found.",
                code: 404
            });
        }

        return res.status(200).json({
            message: "Registration deleted successfully!",
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while deleting the registration.",
            error: error.message,
            code: 500
        });
    }
};

const listRegistrations = async (req, res, next) => {
    try {
        const registrations = await db.registration.findAll({
            include: [
                {
                    model: db.student,
                    as: 'students',
                    include: [{
                        model: db.person,
                        as: 'personProfile2',
                        attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth']
                    }]
                },
                {
                    model: db.program,
                    as: 'programs',
                    attributes: ['ID_ROWID', 'title']
                }
            ]
        });
console.log(registrations);
        if (!registrations) {
            return res.send({
                message: "No registrations found.",
                code: 404
            });
        }

        return res.send({
            message: "Registrations fetched successfully.",
            registrations: registrations,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetching the registrations.",
            error: error.message,
            code: 400
        });
    }
};
const getStudentsForProgram = async (req, res, next) => {
    try {
        const programId = req.params.id; // Assuming the program ID is passed as a parameter in the URL

        if (!programId) {
            return res.status(400).json({
                message: "Error! Program ID is required.",
                code: 400
            });
        }

        // Fetch all registrations for the specified program
        const registrations = await db.registration.findAll({
            where: { progID: programId },
            include: [{
                model: db.student,
                as: 'students',
                include: [{
                    model: db.person,
                    as: 'personProfile2',
                    attributes: ['firstName', 'lastName', 'mail', 'phoneNumber', 'dateOfBirth']
                }]
            }]
        });

        // Transform the result into a desired structure
        const students = registrations.map(reg => {
            const student = reg.students;
            return {
                id: student.ID_ROWID,
                name: `${student.personProfile2.firstName} ${student.personProfile2.lastName}`,
                phone: student.personProfile2.phoneNumber,
                email: student.personProfile2.mail,
                dateOfBirth: student.personProfile2.dateOfBirth
            };
        });

        return res.status(200).json({
            message: "Students fetched successfully.",
            students: students,
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching students for the program.",
            error: error.message,
            code: 500
        });
    }
};

// Remember to export the new function
module.exports = {
    addRegistration,
    removeRegistration,
    listRegistrations,
    getStudentsForProgram // Newly added method
};
// Exporting the functions so they can be used elsewhere
