const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Result Management
async function uploadResult(req, res) {
  try {
    const { courseAllocationId, academicSessionId, results } = req.body;
    if (!courseAllocationId || !academicSessionId || !Array.isArray(results)) {
      return res.status(400).json({ error: 'courseAllocationId, academicSessionId, and results array are required' });
    }

    const allocation = await prisma.courseAllocation.findUnique({
      where: { id: courseAllocationId },
      include: { lecturer: true }
    });
    if (!allocation) return res.status(404).json({ error: 'Course allocation not found' });
    if (allocation.lecturer.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only upload results for your allocated course' });
    }

    const createdResults = [];
    for (const result of results) {
      const { studentId, totalScore, grade = '', gradePoint = 0, remark = '' } = result;
      if (!studentId || totalScore === undefined) continue;

      const resultHeader = await prisma.resultHeader.create({
        data: {
          studentId,
          courseAllocationId,
          academicSessionId,
          semesterId: allocation.semesterId,
          totalScore,
          grade,
          gradePoint,
          remark
        }
      });
      createdResults.push(resultHeader);
    }

    await auditService.log({
      userId: req.user.id,
      action: 'result.upload',
      meta: { courseAllocationId, count: createdResults.length }
    });

    return res.status(201).json({ uploadedCount: createdResults.length, results: createdResults });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listResults(req, res) {
  try {
    const results = await prisma.resultHeader.findMany({
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        courseAllocation: {
          include: {
            course: { select: { code: true, title: true } },
            lecturer: { include: { user: { select: { firstName: true, lastName: true } } } }
          }
        },
        academicSession: true,
        approvals: { include: { approvedBy: { select: { firstName: true, lastName: true, email: true } } } },
        corrections: { include: { correctedBy: { select: { firstName: true, lastName: true, email: true } } } }
      }
    });
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getResult(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid result id' });

    const result = await prisma.resultHeader.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        courseAllocation: { include: { course: true, lecturer: { include: { user: true } } } },
        academicSession: true,
        results: true,
        approvals: { include: { approvedBy: { select: { firstName: true, lastName: true } } } },
        corrections: { include: { correctedBy: { select: { firstName: true, lastName: true } } } }
      }
    });

    if (!result) return res.status(404).json({ error: 'Result not found' });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateResult(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid result id' });

    const { totalScore, grade, gradePoint, remark } = req.body;
    const data = {};
    if (totalScore !== undefined) data.totalScore = totalScore;
    if (grade !== undefined) data.grade = grade;
    if (gradePoint !== undefined) data.gradePoint = gradePoint;
    if (remark !== undefined) data.remark = remark;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });

    const result = await prisma.resultHeader.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'result.update', meta: { resultId: id } });
    return res.json(result);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Result not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function approveResult(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid result id' });

    const result = await prisma.resultHeader.update({ where: { id }, data: { status: 'Approved' } });

    await prisma.resultApproval.create({
      data: {
        resultHeaderId: id,
        approvedById: req.user.id,
        status: 'Approved',
        comment: 'Result approved'
      }
    });

    await auditService.log({ userId: req.user.id, action: 'result.approve', meta: { resultId: id } });
    return res.json(result);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Result not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function rejectResult(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid result id' });

    const { reason } = req.body;
    const result = await prisma.resultHeader.update({ where: { id }, data: { status: 'Rejected' } });

    await prisma.resultApproval.create({
      data: {
        resultHeaderId: id,
        approvedById: req.user.id,
        status: 'Rejected',
        comment: reason || 'Result rejected'
      }
    });

    await auditService.log({ userId: req.user.id, action: 'result.reject', meta: { resultId: id, reason } });
    return res.json(result);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Result not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function publishResult(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid result id' });

    const result = await prisma.resultHeader.update({ where: { id }, data: { status: 'Published' } });

    await auditService.log({ userId: req.user.id, action: 'result.publish', meta: { resultId: id } });
    return res.json(result);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Result not found' });
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  uploadResult,
  listResults,
  getResult,
  updateResult,
  approveResult,
  rejectResult,
  publishResult
};
