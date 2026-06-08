const prisma = require('../prismaClient');
const auditService = require('../services/auditService');
const rbacService = require('../services/rbacService');

async function createTranscriptRequest(req, res) {
  try {
    const { studentId, academicSessionId } = req.body;
    if (!studentId || !academicSessionId) {
      return res.status(400).json({ error: 'studentId and academicSessionId are required' });
    }

    const isStudent = await rbacService.userHasRole(req.user.id, 'Student');
    if (isStudent) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || student.userId !== req.user.id) {
        return res.status(403).json({ error: 'Students can only request their own transcript' });
      }
    }

    const request = await prisma.transcriptRequest.create({
      data: {
        studentId,
        academicSessionId,
        status: 'Pending'
      }
    });

    await auditService.log({ userId: req.user.id, action: 'transcript.request', meta: { transcriptRequestId: request.id, studentId } });
    return res.status(201).json(request);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Transcript request already exists for this session' });
    return res.status(500).json({ error: err.message });
  }
}

async function listTranscriptRequests(req, res) {
  try {
    const where = {};
    if (await rbacService.userHasRole(req.user.id, 'Student')) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!student) return res.status(404).json({ error: 'Student profile not found' });
      where.studentId = student.id;
    }

    const requests = await prisma.transcriptRequest.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        academicSession: true,
        processedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        transcript: true
      },
      orderBy: { requestedAt: 'desc' }
    });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function approveTranscriptRequest(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid transcript request id' });

    const request = await prisma.transcriptRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Transcript request not found' });
    if (request.status === 'Processed' || request.status === 'Issued') {
      return res.status(400).json({ error: 'Transcript request has already been processed' });
    }

    const transcriptContent = `Official transcript for student ${request.studentId} for ${request.academicSessionId}.`;
    const transcript = await prisma.transcript.upsert({
      where: { transcriptRequestId: id },
      create: {
        transcriptRequestId: id,
        content: transcriptContent,
        status: 'Issued'
      },
      update: {
        content: transcriptContent,
        status: 'Issued'
      }
    });

    const updatedRequest = await prisma.transcriptRequest.update({
      where: { id },
      data: {
        status: 'Processed',
        processedAt: new Date(),
        processedById: req.user.id
      }
    });

    await auditService.log({ userId: req.user.id, action: 'transcript.approve', meta: { transcriptRequestId: id } });
    return res.json({ request: updatedRequest, transcript });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function rejectTranscriptRequest(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid transcript request id' });

    const request = await prisma.transcriptRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Transcript request not found' });
    if (request.status === 'Processed' || request.status === 'Issued') {
      return res.status(400).json({ error: 'Transcript request has already been processed' });
    }

    const updatedRequest = await prisma.transcriptRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        processedAt: new Date(),
        processedById: req.user.id
      }
    });

    await auditService.log({ userId: req.user.id, action: 'transcript.reject', meta: { transcriptRequestId: id } });
    return res.json(updatedRequest);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createTranscriptRequest,
  listTranscriptRequests,
  approveTranscriptRequest,
  rejectTranscriptRequest
};
