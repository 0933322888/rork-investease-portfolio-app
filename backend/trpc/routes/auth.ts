import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db, schema } from "../../db";
import { eq } from "drizzle-orm";

export const authRouter = createTRPCRouter({
  bootstrap: protectedProcedure
    .input(
      z.object({
        email: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clerkUserId = ctx.clerkUserId;

      const existingUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.clerkUserId, clerkUserId))
        .limit(1);

      if (existingUsers.length > 0) {
        const user = existingUsers[0];
        await db
          .update(schema.users)
          .set({
            email: input.email || user.email,
            firstName: input.firstName || user.firstName,
            lastName: input.lastName || user.lastName,
            avatarUrl: input.avatarUrl || user.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, user.id));

        const portfolios = await db
          .select()
          .from(schema.portfolios)
          .where(eq(schema.portfolios.userId, user.id))
          .limit(1);

        return {
          user: { ...user, email: input.email || user.email },
          portfolio: portfolios[0] || null,
          isNew: false,
        };
      }

      const [newUser] = await db
        .insert(schema.users)
        .values({
          clerkUserId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          avatarUrl: input.avatarUrl,
        })
        .returning();

      const [newPortfolio] = await db
        .insert(schema.portfolios)
        .values({
          userId: newUser.id,
        })
        .returning();

      return {
        user: newUser,
        portfolio: newPortfolio,
        isNew: true,
      };
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.clerkUserId, ctx.clerkUserId))
        .limit(1);

      if (users.length === 0) return null;

      const portfolios = await db
        .select()
        .from(schema.portfolios)
        .where(eq(schema.portfolios.userId, users[0].id))
        .limit(1);

      return {
        user: users[0],
        portfolio: portfolios[0] || null,
      };
    }),

  getSubscriptionStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const users = await db
        .select({ subscriptionStatus: schema.users.subscriptionStatus })
        .from(schema.users)
        .where(eq(schema.users.clerkUserId, ctx.clerkUserId))
        .limit(1);

      if (users.length === 0) return { status: "free" as const };
      return { status: users[0].subscriptionStatus as "free" | "premium" };
    }),

  updateSubscription: protectedProcedure
    .input(z.object({
      status: z.enum(["free", "premium"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .update(schema.users)
        .set({
          subscriptionStatus: input.status,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.clerkUserId, ctx.clerkUserId))
        .returning();

      if (result.length === 0) {
        throw new Error("User not found");
      }

      return { status: result[0].subscriptionStatus };
    }),
});
