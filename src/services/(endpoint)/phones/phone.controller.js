import phoneNumbersModel from '@/models/phonenumbers.model';
import dbConnect from '@/mongodb';
// 🧩 Get all phones
export async function getPhones() {
  try {
    await dbConnect();

    const phones = await phoneNumbersModel.find({});
    return phones;
  } catch (err) {
    console.error('Error fetching phones:', err);
    throw new Error('Database error while fetching phones');
  }
}

export async function createPhone(data) {
  try {
    await dbConnect();

    const newPhone = await phoneNumbersModel.create(data);
    return newPhone.toObject();
  } catch (err) {
    console.error('Error creating a new phone:', err);
    throw new Error('Database error while creating phone');
  }
}

// UPDATE
export async function updatePhoneById(id, updates) {
  try {
    await dbConnect();

    const updated = await phoneNumbersModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    return updated;
  } catch (err) {
    console.error('Error updating phone:', err);
    throw new Error('Database error while updating phone');
  }
}

// DELETE
export async function deletePhoneById(id) {
  try {
    await dbConnect();

    const deleted = await phoneNumbersModel.findByIdAndDelete(id).lean();
    return deleted;
  } catch (err) {
    console.error('Error deleting phone:', err);
    throw new Error('Database error while deleting phone');
  }
}
