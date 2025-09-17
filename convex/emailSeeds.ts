import { mutation } from "./_generated/server";

export const seedEmailTemplates = mutation({
  handler: async (ctx) => {
    const now = new Date().toISOString();

    // Check if templates already exist
    const existingTemplates = await ctx.db.query("emailTemplates").collect();
    if (existingTemplates.length > 0) {
      return { message: "Templates already exist" };
    }

    const templates = [
      {
        name: "Interview Invitation",
        category: "interview",
        subject: "Interview Invitation - {{jobTitle}} Position at EvalATS",
        content: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at EvalATS. We were impressed with your application and would like to invite you for an interview.

Interview Details:
- Position: {{jobTitle}}
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Duration: {{interviewDuration}}
- Location: {{interviewLocation}}

Please confirm your availability by replying to this email. If you have any questions or need to reschedule, please don't hesitate to reach out.

We look forward to speaking with you.

Best regards,
The EvalATS Team`,
        type: "interview_invitation" as const,
        variables: ["candidateName", "jobTitle", "interviewDate", "interviewTime", "interviewDuration", "interviewLocation"],
        tags: ["interview", "invitation"],
        isActive: true,
        useCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Application Acknowledgment",
        category: "application",
        subject: "Thank you for your application - {{jobTitle}}",
        content: `Dear {{candidateName}},

Thank you for applying for the {{jobTitle}} position at EvalATS. We have received your application and are currently reviewing it.

We will be in touch within the next few days to update you on the status of your application. In the meantime, if you have any questions, please feel free to reach out.

Best regards,
The EvalATS Team`,
        type: "follow_up" as const,
        variables: ["candidateName", "jobTitle"],
        tags: ["application", "acknowledgment"],
        isActive: true,
        useCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Job Offer",
        category: "offer",
        subject: "Job Offer - {{jobTitle}} Position at EvalATS",
        content: `Dear {{candidateName}},

We are pleased to offer you the position of {{jobTitle}} at EvalATS. After careful consideration, we believe you would be a valuable addition to our team.

Offer Details:
- Position: {{jobTitle}}
- Start Date: {{startDate}}
- Salary: {{salary}}
- Benefits: {{benefits}}

Please review the attached offer letter for complete details. We would like to have your response by {{responseDeadline}}.

If you have any questions about the offer, please don't hesitate to contact us.

Congratulations and we look forward to working with you!

Best regards,
The EvalATS Team`,
        type: "offer" as const,
        variables: ["candidateName", "jobTitle", "startDate", "salary", "benefits", "responseDeadline"],
        tags: ["offer", "job"],
        isActive: true,
        useCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Application Rejection",
        category: "rejection",
        subject: "Update on your application - {{jobTitle}}",
        content: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at EvalATS and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We appreciate the time and effort you put into your application. Please don't let this discourage you from applying for future opportunities with us that may be a better fit.

We wish you the best of luck in your job search.

Best regards,
The EvalATS Team`,
        type: "rejection" as const,
        variables: ["candidateName", "jobTitle"],
        tags: ["rejection", "application"],
        isActive: true,
        useCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Assessment Invitation",
        category: "assessment",
        subject: "Next Step: Assessment for {{jobTitle}} Position",
        content: `Dear {{candidateName}},

Thank you for your continued interest in the {{jobTitle}} position at EvalATS.

As the next step in our hiring process, we would like to invite you to complete an assessment. This will help us better understand your skills and qualifications for the role.

Assessment Details:
- Assessment Type: {{assessmentType}}
- Time Limit: {{timeLimit}}
- Instructions: {{instructions}}

Please complete the assessment by {{deadline}}. You can access it using the link below:
{{assessmentLink}}

If you have any technical issues or questions, please contact us immediately.

Best regards,
The EvalATS Team`,
        type: "assessment" as const,
        variables: ["candidateName", "jobTitle", "assessmentType", "timeLimit", "instructions", "deadline", "assessmentLink"],
        tags: ["assessment", "invitation"],
        isActive: true,
        useCount: 0,
        createdAt: now,
        updatedAt: now,
      }
    ];

    const insertedIds = [];
    for (const template of templates) {
      const id = await ctx.db.insert("emailTemplates", template);
      insertedIds.push(id);
    }

    return { message: `Created ${insertedIds.length} email templates`, ids: insertedIds };
  },
});