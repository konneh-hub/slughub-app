const prisma = require('../prismaClient');
const auditService = require('../services/auditService');
const rbacService = require('../services/rbacService');

async function createCorrection(req, res) {
  try {
    const resultHeaderId = parseInt(req.params.id, 10);
    const { correctionType, oldScore, newScore, comment } = req.body;
    if (Number.isNaN(resultHeaderId) || !correctionType || oldScore === undefined || newScore === undefined) {
      return res.status(400).json({ error: 'resultHeaderId, correctionType, oldScore, and newScore are required' });
    }

    const resultHeader = await prisma.resultHeader.findUnique({ where: { id: resultHeaderId } });
    if (!resultHeader) return res.status(404).json({ error: 'Result not found' });

    const isRequesterStudent = await rbacService.userHasRole(req.user.id, 'Student');
    if (isRequesterStudent) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!student || student.id !== resultHeader.studentId) {
        return res.status(403).json({ error: 'Students can only request corrections for their own results' });
      }
    }

    const correction = await prisma.resultCorrection.create({
      data: {
        resultHeaderId,
        correctedById: req.user.id,
        correctionType,
        oldScore,
        newScore,
        comment
      }
    });

    await auditService.log({ userId: req.user.id, action: 'result.correction.request', meta: { correctionId: correction.id, resultHeaderId } });
    return res.status(201).json(correction);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listCorrections(req, res) {
  try {
    const resultHeaderId = parseInt(req.params.id, 10);
    if (Number.isNaN(resultHeaderId)) return res.status(400).json({ error: 'Invalid result id' });

    const corrections = await prisma.resultCorrection.findMany({
      where: { resultHeaderId },
      include: {
        correctedBy: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    });
    return res.json(corrections);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function approveCorrection(req, res) {
  try {
    const correctionId = parseInt(req.params.id, 10);
    if (Number.isNaN(correctionId)) return res.status(400).json({ error: 'Invalid correction id' });

    const correction = await prisma.resultCorrection.findUnique({ where: { id: correctionId } });
    if (!correction) return res.status(404).json({ error: 'Correction request not found' });

    const resultHeader = await prisma.resultHeader.findUnique({ where: { id: correction.resultHeaderId } });
    if (!resultHeader) return res.status(404).json({ error: 'Result header not found' });

    await prisma.$transaction(async (tx) => {
      await tx.resultHeader.update({
        where: { id: resultHeader.id },
        data: {
          totalScore: correction.newScore,
          gradePoint: resultHeader.gradePoint,
          grade: resultHeader.grade,
          remark: resultHeader.remark
        }
      });
      await tx.resultCorrection.update({ where: { id: correctionId }, data: { comment: correction.comment || '', correctedById: correction.correctedById } });
    });

    await auditService.log({ userId: req.user.id, action: 'result.correction.approve', meta: { correctionId } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createCorrection, listCorrections, approveCorrection };
