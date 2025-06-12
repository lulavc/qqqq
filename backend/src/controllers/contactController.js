const Contact = require('../models/Contact');
const { sendContactEmail } = require('../services/emailService');

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Create contact record
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });

    // Send email
    await sendContactEmail({ name, email, subject, message });

    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso!',
      data: contact
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem. Por favor, tente novamente.'
    });
  }
};

// Get all contact messages (admin only)
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens.'
    });
  }
};

// Update contact status (admin only)
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da mensagem.'
    });
  }
};

// Delete contact message (admin only)
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mensagem excluída com sucesso'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir mensagem.'
    });
  }
}; 