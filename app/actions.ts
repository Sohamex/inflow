'use server'
import prisma from '@/lib/prisma';

export async function fetchAllData() {
  const projects = await prisma.project.findMany();
  const chats = await prisma.chat.findMany();
  const turns = await prisma.turn.findMany();
  return { projects, chats, turns };
}

export async function createProjectAction(data: { id: string, name: string }) {
  return prisma.project.create({ data });
}

export async function renameProjectAction(id: string, name: string) {
  return prisma.project.update({ where: { id }, data: { name } });
}

export async function deleteProjectAction(id: string) {
  return prisma.project.delete({ where: { id } });
}

export async function createChatAction(data: { id: string, name: string, projectId: string | null }) {
  return prisma.chat.create({ data });
}

export async function renameChatAction(id: string, name: string) {
  return prisma.chat.update({ where: { id }, data: { name } });
}

export async function deleteChatAction(id: string) {
  return prisma.chat.delete({ where: { id } });
}

export async function moveChatAction(id: string, projectId: string | null) {
  return prisma.chat.update({ where: { id }, data: { projectId } });
}

export async function createTurnAction(data: { id: string, chatId: string, userQuery: string, aiResponse: string, parentId: string | null }) {
  return prisma.turn.create({ data });
}

export async function updateTurnAiResponseAction(id: string, aiResponse: string) {
  return prisma.turn.update({ where: { id }, data: { aiResponse } });
}

export async function deleteTurnsAction(ids: string[]) {
  return prisma.turn.deleteMany({ where: { id: { in: ids } } });
}

export async function reassignTurnParentsAction(updates: { id: string, parentId: string | null }[]) {
  // SQLite doesn't support bulk updates with different values easily, so we do it in a transaction
  return prisma.$transaction(
    updates.map(u => prisma.turn.update({ where: { id: u.id }, data: { parentId: u.parentId } }))
  );
}
