import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not, Equal, LessThan, MoreThan } from 'typeorm';
import { TeacherStats, StatsPeriod } from './entities/teacher-stats.entity';
import { Lesson, LessonStatus, LessonRecurrenceType, PricingType } from './entities/lesson.entity';
import { LessonAttendance, AttendanceStatus } from './entities/lesson-attendance.entity';

@Injectable()
export class TeacherStatsService {
  constructor(
    @InjectRepository(TeacherStats)
    private teacherStatsRepository: Repository<TeacherStats>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonAttendance)
    private attendanceRepository: Repository<LessonAttendance>,
  ) {}

  // Update stats when a lesson is created
  async onLessonCreated(lesson: Lesson): Promise<void> {
    // Use current date (when lesson is actually created) instead of scheduled date
    const currentDate = new Date();
    await this.updateStatsForLessonWithDate(lesson, 'created', { 
      totalLessons: 1 
    }, currentDate);
  }

  // Update stats when a student is added to a lesson
  async onStudentAddedToLesson(lessonId: string): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students']
    });
    if (lesson) {
      // Use current date (when student is actually added) instead of lesson date
      const currentDate = new Date();
      await this.updateStatsForLessonWithDate(lesson, 'student_added', { 
        totalStudents: 1 
      }, currentDate);
    }
  }

  // Update stats when a student is removed from a lesson
  async onStudentRemovedFromLesson(lessonId: string): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students']
    });
    if (lesson) {
      // Use current date (when student is actually removed) instead of lesson date
      const currentDate = new Date();
      await this.updateStatsForLessonWithDate(lesson, 'student_removed', { 
        totalStudents: -1 
      }, currentDate);
    }
  }

  // Update stats when attendance is marked
  async onAttendanceMarked(lessonId: string): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students']
    });
    if (lesson) {
      // Use lesson's scheduled date for attendance stats (not current date)
      const lessonDate = new Date(lesson.scheduledDate);
      await this.updateStatsForLessonWithDate(lesson, 'attendance_marked', { 
        totalAttendance: 1 
      }, lessonDate);
    }
  }

  // Update stats when lesson status changes
  async onLessonStatusChanged(lesson: Lesson, oldStatus?: LessonStatus, originalDate?: Date): Promise<void> {
    const updates: any = {};
    
    // If we have the old status, decrement it
    if (oldStatus) {
      if (oldStatus === LessonStatus.COMPLETED) {
        updates.completedLessons = -1;
      } else if (oldStatus === LessonStatus.CANCELLED) {
        updates.cancelledLessons = -1;
      } else if (oldStatus === LessonStatus.EXPIRED) {
        updates.expiredLessons = -1;
      }
    }
    
    // Increment the new status
    if (lesson.status === LessonStatus.COMPLETED) {
      updates.completedLessons = (updates.completedLessons || 0) + 1;
    } else if (lesson.status === LessonStatus.CANCELLED) {
      updates.cancelledLessons = (updates.cancelledLessons || 0) + 1;
    } else if (lesson.status === LessonStatus.EXPIRED) {
      updates.expiredLessons = (updates.expiredLessons || 0) + 1;
    }
    
    // Use current date (when status is actually changed) instead of lesson date
    const currentDate = new Date();
    
    await this.updateStatsForLessonWithDate(lesson, 'status_changed', updates, currentDate);
  }

  // Update stats when a lesson is completed
  async onLessonCompleted(lesson: Lesson): Promise<void> {
    console.log('TeacherStatsService - onLessonCompleted called with lesson:', {
      lessonId: lesson.id,
      title: lesson.title,
      pricingType: lesson.pricingType,
      price: lesson.price,
      priceType: typeof lesson.price,
      scheduledDate: lesson.scheduledDate,
      teacherId: lesson.teacherId,
      studentsCount: lesson.students?.length || 0,
      students: lesson.students?.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName })) || []
    });

    // Calculate earnings based on pricing type
    let earnings = 0;
    const lessonPrice = parseFloat(lesson.price?.toString()) || 0;
    
    console.log('TeacherStatsService - Initial values:', {
      lessonPrice,
      lessonPriceType: typeof lessonPrice,
      pricingType: lesson.pricingType,
      pricingTypeType: typeof lesson.pricingType,
      isMonthly: lesson.pricingType === PricingType.MONTHLY,
      isMonthlyEnum: lesson.pricingType === PricingType.MONTHLY
    });
    
    if (lesson.pricingType === PricingType.MONTHLY) {
      console.log('TeacherStatsService - Processing monthly pricing with WEEK COUNT logic');
      console.log('TeacherStatsService - Lesson details:', {
        lessonId: lesson.id,
        pricingType: lesson.pricingType,
        recurrenceType: lesson.recurrenceType,
        scheduledDate: lesson.scheduledDate,
        price: lesson.price
      });
      
      // For monthly pricing, only apply to recurring lessons
      if (lesson.recurrenceType === LessonRecurrenceType.NONE) {
        console.log('TeacherStatsService - Non-recurring lesson, calculating normal earnings');
        const enrolledStudentsCount = lesson.students?.length || 0;
        earnings = lessonPrice * enrolledStudentsCount;
      } else {
        console.log('TeacherStatsService - Recurring lesson, applying week count logic');
        
        // For recurring lessons, calculate week count based on the scheduled date
        // Each week represents one occurrence of the lesson
        
        // Get the lesson's original creation date and first scheduled date
        const lessonCreationDate = new Date(lesson.createdAt);
        const firstScheduledDate = new Date(lessonCreationDate);
        
        // For weekly recurring lessons, each week = 1 occurrence
        // For monthly recurring lessons, each month = 1 occurrence
        // For daily recurring lessons, each day = 1 occurrence
        
        let weekCount = 1; // Start with 1 for the current occurrence
        
        if (lesson.recurrenceType === LessonRecurrenceType.WEEKLY) {
          // Calculate weeks since creation
          const weeksSinceCreation = Math.floor((new Date(lesson.scheduledDate).getTime() - lessonCreationDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          weekCount = weeksSinceCreation + 1;
        } else if (lesson.recurrenceType === LessonRecurrenceType.DAILY) {
          // Calculate days since creation
          const daysSinceCreation = Math.floor((new Date(lesson.scheduledDate).getTime() - lessonCreationDate.getTime()) / (24 * 60 * 60 * 1000));
          weekCount = Math.ceil(daysSinceCreation / 7) + 1; // Convert days to weeks
        } else if (lesson.recurrenceType === LessonRecurrenceType.MONTHLY) {
          // Calculate months since creation
          const monthsSinceCreation = Math.floor((new Date(lesson.scheduledDate).getTime() - lessonCreationDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
          weekCount = monthsSinceCreation * 4 + 1; // Convert months to weeks (1 month = 4 weeks)
        }
        
        console.log('TeacherStatsService - Week count calculation for recurring lesson:', {
          lessonCreationDate: lessonCreationDate.toISOString(),
          currentScheduledDate: lesson.scheduledDate,
          recurrenceType: lesson.recurrenceType,
          weekCount,
          isMultipleOfFour: weekCount % 4 === 0
        });
        
        // Calculate earnings only when week count is a multiple of 4 (4, 8, 12, etc.)
        if (weekCount % 4 === 0) {
          const enrolledStudentsCount = lesson.students?.length || 0;
          const monthsCount = weekCount / 4; // Convert weeks to months (4 weeks = 1 month)
          earnings = lessonPrice * enrolledStudentsCount * monthsCount;
          
          console.log('TeacherStatsService - Monthly pricing earnings calculation (week count multiple of 4):', {
            lessonId: lesson.id,
            lessonPrice,
            enrolledStudentsCount,
            weekCount,
            monthsCount,
            calculatedEarnings: earnings,
            pricingType: lesson.pricingType
          });
        } else {
          console.log('TeacherStatsService - Skipping earnings, week count not multiple of 4:', {
            lessonId: lesson.id,
            weekCount,
            nextEarningsAt: Math.ceil(weekCount / 4) * 4
          });
        }
      }
    } else {
      console.log('TeacherStatsService - Processing per_lesson pricing');
      
      // For per_lesson pricing, calculate earnings based on number of students who were PRESENT
      const presentStudentsCount = await this.attendanceRepository.count({
        where: { 
          lessonId: lesson.id,
          status: AttendanceStatus.PRESENT
        }
      });
      earnings = lessonPrice * presentStudentsCount;
      
      console.log('TeacherStatsService - Per lesson pricing earnings calculation:', {
        lessonId: lesson.id,
        lessonPrice,
        presentStudentsCount,
        calculatedEarnings: earnings,
        pricingType: lesson.pricingType
      });
    }
    
    console.log('TeacherStatsService - Final earnings calculation:', {
      earnings,
      earningsType: typeof earnings
    });
    
    // Count each lesson completion (this is correct for tracking activity)
    // The issue with completion rate will be fixed in the aggregation logic
    const updates = { 
      completedLessons: 1,
      totalEarnings: earnings
    };
    
    console.log('TeacherStatsService - Updates object:', updates);
    
    // Use different dates based on pricing type:
    // - For daily lessons: Use current date (actual completion date)
    // - For monthly lessons: Use lesson's scheduled date (for proper week counting)
    let statsDate: Date;
    
    console.log('TeacherStatsService - Date selection logic:', {
      lessonId: lesson.id,
      pricingType: lesson.pricingType,
      recurrenceType: lesson.recurrenceType,
      scheduledDate: lesson.scheduledDate,
      isMonthlyRecurring: lesson.pricingType === PricingType.MONTHLY && lesson.recurrenceType !== LessonRecurrenceType.NONE
    });
    
    if (lesson.pricingType === PricingType.MONTHLY && lesson.recurrenceType !== LessonRecurrenceType.NONE) {
      // For monthly recurring lessons, use scheduled date for proper week counting
      statsDate = new Date(lesson.scheduledDate);
      console.log('TeacherStatsService - Using scheduled date for monthly recurring lesson:', {
        lessonId: lesson.id,
        scheduledDate: lesson.scheduledDate,
        statsDate: statsDate.toISOString()
      });
    } else {
      // For daily lessons and other types, use current date (actual completion date)
      statsDate = new Date();
      console.log('TeacherStatsService - Using current date for daily/other lesson:', {
        lessonId: lesson.id,
        currentDate: statsDate.toISOString(),
        scheduledDate: lesson.scheduledDate
      });
    }
    
    await this.updateStatsForLessonWithDate(lesson, 'completed', updates, statsDate);
  }

  // Main method to update stats for a lesson with cumulative changes
  private async updateStatsForLesson(lesson: Lesson, action: string, changes: any): Promise<void> {
    const lessonDate = new Date(lesson.scheduledDate);
    await this.updateStatsForLessonWithDate(lesson, action, changes, lessonDate);
  }

  // Main method to update stats for a lesson with a specific date
  private async updateStatsForLessonWithDate(lesson: Lesson, action: string, changes: any, lessonDate: Date): Promise<void> {
    console.log('TeacherStatsService - Updating stats with date:', {
      action,
      lessonId: lesson.id,
      lessonDate: lessonDate.toISOString().split('T')[0],
      changes
    });
    
    // Update daily stats
    await this.updateDailyStats(lesson, lessonDate, changes);
    
    // Update weekly stats
    await this.updateWeeklyStats(lesson, lessonDate, changes);
    
    // Update monthly stats
    await this.updateMonthlyStats(lesson, lessonDate, changes);
  }

  // Update daily stats cumulatively
  private async updateDailyStats(lesson: Lesson, lessonDate: Date, changes: any): Promise<void> {
    const dateKey = lessonDate.toISOString().split('T')[0];
    
    let dailyStats = await this.teacherStatsRepository.findOne({
      where: {
        teacherId: lesson.teacherId,
        period: StatsPeriod.DAILY,
        date: lessonDate
      }
    });

    if (!dailyStats) {
      dailyStats = this.teacherStatsRepository.create({
        teacherId: lesson.teacherId,
        period: StatsPeriod.DAILY,
        date: lessonDate,
        totalLessons: 0,
        totalStudents: 0,
        totalAttendance: 0,
        totalEarnings: 0,
        completedLessons: 0,
        cancelledLessons: 0,
        expiredLessons: 0,
        averageEarningsPerLesson: 0,
        averageStudentsPerLesson: 0,
        completionRate: 0
      });
    }

    // Apply cumulative changes
    if (changes.totalLessons) {
      dailyStats.totalLessons += changes.totalLessons;
    }
    if (changes.totalStudents) {
      dailyStats.totalStudents += changes.totalStudents;
    }
    if (changes.totalAttendance) {
      dailyStats.totalAttendance += changes.totalAttendance;
    }
    if (changes.totalEarnings) {
      // Ensure proper decimal handling
      const currentEarnings = parseFloat(dailyStats.totalEarnings.toString()) || 0;
      const newEarnings = parseFloat(changes.totalEarnings.toString()) || 0;
      dailyStats.totalEarnings = currentEarnings + newEarnings;
      
      console.log('TeacherStatsService - Updating earnings:', {
        current: currentEarnings,
        adding: newEarnings,
        newTotal: dailyStats.totalEarnings
      });
    }
    if (changes.completedLessons) {
      dailyStats.completedLessons += changes.completedLessons;
    }
    if (changes.cancelledLessons) {
      dailyStats.cancelledLessons += changes.cancelledLessons;
    }
    if (changes.expiredLessons) {
      dailyStats.expiredLessons += changes.expiredLessons;
    }

    // Recalculate averages with proper decimal handling
    const totalLessons = dailyStats.totalLessons;
    const totalEarnings = parseFloat(dailyStats.totalEarnings.toString()) || 0;
    const totalStudents = dailyStats.totalStudents;
    const completedLessons = dailyStats.completedLessons;
    
    dailyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
    dailyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
    dailyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    console.log('TeacherStatsService - Daily stats after update:', {
      date: lessonDate.toISOString().split('T')[0],
      totalLessons: dailyStats.totalLessons,
      totalStudents: dailyStats.totalStudents,
      totalAttendance: dailyStats.totalAttendance,
      totalEarnings: dailyStats.totalEarnings,
      completedLessons: dailyStats.completedLessons,
      completionRate: dailyStats.completionRate,
      changes: changes
    });

    await this.teacherStatsRepository.save(dailyStats);
  }

  // Update weekly stats cumulatively
  private async updateWeeklyStats(lesson: Lesson, lessonDate: Date, changes: any): Promise<void> {
    const weekStart = this.getWeekStart(lessonDate);
    
    let weeklyStats = await this.teacherStatsRepository.findOne({
      where: {
        teacherId: lesson.teacherId,
        period: StatsPeriod.WEEKLY,
        date: weekStart
      }
    });

    if (!weeklyStats) {
      weeklyStats = this.teacherStatsRepository.create({
        teacherId: lesson.teacherId,
        period: StatsPeriod.WEEKLY,
        date: weekStart,
        totalLessons: 0,
        totalStudents: 0,
        totalAttendance: 0,
        totalEarnings: 0,
        completedLessons: 0,
        cancelledLessons: 0,
        expiredLessons: 0,
        averageEarningsPerLesson: 0,
        averageStudentsPerLesson: 0,
        completionRate: 0
      });
    }

    // Apply cumulative changes
    if (changes.totalLessons) {
      weeklyStats.totalLessons += changes.totalLessons;
    }
    if (changes.totalStudents) {
      weeklyStats.totalStudents += changes.totalStudents;
    }
    if (changes.totalAttendance) {
      weeklyStats.totalAttendance += changes.totalAttendance;
    }
    if (changes.totalEarnings) {
      // Ensure proper decimal handling
      const currentEarnings = parseFloat(weeklyStats.totalEarnings.toString()) || 0;
      const newEarnings = parseFloat(changes.totalEarnings.toString()) || 0;
      weeklyStats.totalEarnings = currentEarnings + newEarnings;
    }
    if (changes.completedLessons) {
      weeklyStats.completedLessons += changes.completedLessons;
    }
    if (changes.cancelledLessons) {
      weeklyStats.cancelledLessons += changes.cancelledLessons;
    }
    if (changes.expiredLessons) {
      weeklyStats.expiredLessons += changes.expiredLessons;
    }

    // Recalculate averages with proper decimal handling
    const totalLessons = weeklyStats.totalLessons;
    const totalEarnings = parseFloat(weeklyStats.totalEarnings.toString()) || 0;
    const totalStudents = weeklyStats.totalStudents;
    const completedLessons = weeklyStats.completedLessons;
    
    weeklyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
    weeklyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
    weeklyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await this.teacherStatsRepository.save(weeklyStats);
  }

  // Update monthly stats cumulatively
  private async updateMonthlyStats(lesson: Lesson, lessonDate: Date, changes: any): Promise<void> {
    const monthStart = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), 1);
    
    let monthlyStats = await this.teacherStatsRepository.findOne({
      where: {
        teacherId: lesson.teacherId,
        period: StatsPeriod.MONTHLY,
        date: monthStart
      }
    });

    if (!monthlyStats) {
      monthlyStats = this.teacherStatsRepository.create({
        teacherId: lesson.teacherId,
        period: StatsPeriod.MONTHLY,
        date: monthStart,
        totalLessons: 0,
        totalStudents: 0,
        totalAttendance: 0,
        totalEarnings: 0,
        completedLessons: 0,
        cancelledLessons: 0,
        expiredLessons: 0,
        averageEarningsPerLesson: 0,
        averageStudentsPerLesson: 0,
        completionRate: 0
      });
    }

    // Apply cumulative changes
    if (changes.totalLessons) {
      monthlyStats.totalLessons += changes.totalLessons;
    }
    if (changes.totalStudents) {
      monthlyStats.totalStudents += changes.totalStudents;
    }
    if (changes.totalAttendance) {
      monthlyStats.totalAttendance += changes.totalAttendance;
    }
    if (changes.totalEarnings) {
      // Ensure proper decimal handling
      const currentEarnings = parseFloat(monthlyStats.totalEarnings.toString()) || 0;
      const newEarnings = parseFloat(changes.totalEarnings.toString()) || 0;
      monthlyStats.totalEarnings = currentEarnings + newEarnings;
    }
    if (changes.completedLessons) {
      monthlyStats.completedLessons += changes.completedLessons;
    }
    if (changes.cancelledLessons) {
      monthlyStats.cancelledLessons += changes.cancelledLessons;
    }
    if (changes.expiredLessons) {
      monthlyStats.expiredLessons += changes.expiredLessons;
    }

    // Recalculate averages with proper decimal handling
    const totalLessons = monthlyStats.totalLessons;
    const totalEarnings = parseFloat(monthlyStats.totalEarnings.toString()) || 0;
    const totalStudents = monthlyStats.totalStudents;
    const completedLessons = monthlyStats.completedLessons;
    
    monthlyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
    monthlyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
    monthlyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await this.teacherStatsRepository.save(monthlyStats);
  }

  // Get week start date (Saturday)
  private getWeekStart(date: Date): Date {
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    // Adjust to make Saturday (6) the start of the week
    // If today is Saturday (6), no adjustment needed
    // If today is Sunday (0), go back 1 day to Saturday
    // If today is Monday (1), go back 2 days to Saturday
    // And so on...
    const daysToSubtract = (dayOfWeek + 1) % 7; // This makes Saturday=0, Sunday=1, Monday=2, etc.
    weekStart.setDate(date.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  // Get stats for a specific period
  async getTeacherStats(teacherId: string, period: StatsPeriod, startDate?: string, endDate?: string): Promise<any> {
    console.log('TeacherStatsService - Getting stats for teacher:', teacherId);
    console.log('TeacherStatsService - Period:', period);
    console.log('TeacherStatsService - StartDate:', startDate);
    console.log('TeacherStatsService - EndDate:', endDate);

    let query = this.teacherStatsRepository.createQueryBuilder('stats')
      .where('stats.teacherId = :teacherId', { teacherId })
      .andWhere('stats.period = :period', { period });

    if (startDate && endDate) {
      query = query.andWhere('stats.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const stats = await query.orderBy('stats.date', 'ASC').getMany();

    console.log('TeacherStatsService - Found stats records:', stats.length);
    console.log('TeacherStatsService - Raw stats data:', JSON.stringify(stats, null, 2));

    // If no stats exist yet, return empty data
    if (stats.length === 0) {
      console.log('TeacherStatsService - No stats found, returning empty data');
      return {
        teacherId,
        period,
        stats: []
      };
    }

    console.log('TeacherStatsService - Processing stats for response...');

    // For weekly stats, we need to calculate completion rate differently
    // because completedLessons counts occurrences, not unique lessons
    if (period === StatsPeriod.WEEKLY) {
      // Get the actual number of unique lessons for this teacher
      const uniqueLessons = await this.lessonRepository.count({
        where: { teacherId }
      });
      
      console.log('TeacherStatsService - Unique lessons count for teacher:', uniqueLessons);
      
      return {
        teacherId,
        period,
        stats: stats.map(stat => {
          console.log('TeacherStatsService - Processing weekly stat:', stat);
          
          // Ensure proper type handling for numeric fields
          const totalLessons = parseInt(stat.totalLessons.toString()) || 0;
          const totalStudents = parseInt(stat.totalStudents.toString()) || 0;
          const totalAttendance = parseInt(stat.totalAttendance.toString()) || 0;
          const totalEarnings = parseFloat(stat.totalEarnings.toString()) || 0;
          const completedLessons = parseInt(stat.completedLessons.toString()) || 0;
          const cancelledLessons = parseInt(stat.cancelledLessons.toString()) || 0;
          const expiredLessons = parseInt(stat.expiredLessons.toString()) || 0;
          const averageEarningsPerLesson = parseFloat(stat.averageEarningsPerLesson.toString()) || 0;
          const averageStudentsPerLesson = parseFloat(stat.averageStudentsPerLesson.toString()) || 0;
          
          // For weekly stats, calculate completion rate based on unique lessons
          // If there are completed lesson occurrences, assume at least one unique lesson was completed
          const completionRate = uniqueLessons > 0 && completedLessons > 0 ? 100 : 0;

          console.log('TeacherStatsService - Weekly stats calculation:', {
            totalLessons,
            totalStudents,
            totalAttendance,
            totalEarnings,
            completedLessons,
            cancelledLessons,
            expiredLessons,
            averageEarningsPerLesson,
            averageStudentsPerLesson,
            uniqueLessons,
            completionRate
          });

          return {
            date: new Date(stat.date).toISOString().split('T')[0],
            totalLessons,
            totalStudents,
            totalAttendance,
            totalEarnings,
            averageEarningsPerLesson,
            averageStudentsPerLesson,
            completionRate,
            completedLessons,
            cancelledLessons,
            expiredLessons
          };
        })
      };
    }

    // For daily and monthly stats, use the original logic
    return {
      teacherId,
      period,
      stats: stats.map(stat => {
        console.log('TeacherStatsService - Processing stat:', stat);
        
        // Ensure proper type handling for numeric fields
        const totalLessons = parseInt(stat.totalLessons.toString()) || 0;
        const totalStudents = parseInt(stat.totalStudents.toString()) || 0;
        const totalAttendance = parseInt(stat.totalAttendance.toString()) || 0;
        const totalEarnings = parseFloat(stat.totalEarnings.toString()) || 0;
        const completedLessons = parseInt(stat.completedLessons.toString()) || 0;
        const cancelledLessons = parseInt(stat.cancelledLessons.toString()) || 0;
        const expiredLessons = parseInt(stat.expiredLessons.toString()) || 0;
        const averageEarningsPerLesson = parseFloat(stat.averageEarningsPerLesson.toString()) || 0;
        const averageStudentsPerLesson = parseFloat(stat.averageStudentsPerLesson.toString()) || 0;
        const completionRate = parseFloat(stat.completionRate.toString()) || 0;

        console.log('TeacherStatsService - Parsed values:', {
          totalLessons,
          totalStudents,
          totalAttendance,
          totalEarnings,
          completedLessons,
          cancelledLessons,
          expiredLessons,
          averageEarningsPerLesson,
          averageStudentsPerLesson,
          completionRate
        });

        return {
          date: new Date(stat.date).toISOString().split('T')[0],
          totalLessons,
          totalStudents,
          totalAttendance,
          totalEarnings,
          averageEarningsPerLesson,
          averageStudentsPerLesson,
          completionRate,
          completedLessons,
          cancelledLessons,
          expiredLessons
        };
      })
    };
  }

  // Initialize stats for existing lessons (useful for migration)
  async initializeStatsForTeacher(teacherId: string): Promise<void> {
    console.log('TeacherStatsService - Initializing stats for teacher:', teacherId);
    
    // Get all lessons for this teacher
    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['students']
    });

    console.log('TeacherStatsService - Found lessons for initialization:', lessons.length);

    // Group lessons by date
    const lessonsByDate = new Map<string, Lesson[]>();
    lessons.forEach(lesson => {
      const lessonDate = new Date(lesson.scheduledDate);
      const dateKey = lessonDate.toISOString().split('T')[0];
      
      console.log('TeacherStatsService - Lesson date processing:', {
        lessonId: lesson.id,
        originalScheduledDate: lesson.scheduledDate,
        lessonDate: lessonDate,
        dateKey: dateKey
      });
      
      if (!lessonsByDate.has(dateKey)) {
        lessonsByDate.set(dateKey, []);
      }
      lessonsByDate.get(dateKey).push(lesson);
    });

    console.log('TeacherStatsService - Lessons grouped by date:', Array.from(lessonsByDate.entries()).map(([date, lessons]) => ({
      date,
      lessonCount: lessons.length,
      lessonIds: lessons.map(l => l.id)
    })));

    // Get attendance data
    const lessonIds = lessons.map(l => l.id);
    const attendanceData = await this.attendanceRepository.find({
      where: { lessonId: In(lessonIds) }
    });

    // Group attendance by lesson
    const attendanceByLesson = attendanceData.reduce((acc, attendance) => {
      if (!acc[attendance.lessonId]) {
        acc[attendance.lessonId] = [];
      }
      acc[attendance.lessonId].push(attendance);
      return acc;
    }, {});

    // Process each date
    for (const [dateKey, dayLessons] of lessonsByDate) {
      const lessonDate = new Date(dateKey);
      
      // Calculate totals for this day
      const totalLessons = dayLessons.length;
      const totalStudents = dayLessons.reduce((sum, lesson) => sum + lesson.students.length, 0);
      const totalEarnings = dayLessons.reduce((sum, lesson) => {
        if (lesson.status === LessonStatus.COMPLETED) {
          const lessonPrice = parseFloat(lesson.price?.toString() || '0');
          
          if (lesson.pricingType === PricingType.MONTHLY) {
            // For monthly pricing, only charge on the first occurrence of each month
            const lessonScheduledDate = new Date(lesson.scheduledDate);
            const monthKey = `${lessonScheduledDate.getFullYear()}-${lessonScheduledDate.getMonth() + 1}`;
            
            // Check if this is the first occurrence of this lesson in this month
            const monthStart = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), 1);
            const monthEnd = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth() + 1, 0, 23, 59, 59, 999);
            
            // Get all completed lessons for this teacher in this month with the same lesson ID
            const completedLessonsInMonth = dayLessons.filter(l => 
              l.id === lesson.id && // Same lesson ID (recurring lesson)
              l.status === LessonStatus.COMPLETED &&
              l.scheduledDate >= monthStart &&
              l.scheduledDate <= monthEnd
            );

            // Filter out the current lesson from the count (since it was just completed)
            const otherCompletedLessonsInMonth = completedLessonsInMonth.filter(l => 
              l.scheduledDate.getTime() !== lessonScheduledDate.getTime()
            );

            // If no other completed lessons in this month yet, this is the first occurrence
            const isFirstOccurrenceInMonth = otherCompletedLessonsInMonth.length === 0;

            if (isFirstOccurrenceInMonth) {
              // Calculate earnings for this month (only on first occurrence)
              const enrolledStudentsCount = lesson.students?.length || 0;
              const lessonEarnings = lessonPrice * enrolledStudentsCount;
              
              console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (monthly):`, {
                lessonPrice,
                enrolledStudentsCount,
                lessonEarnings,
                monthKey,
                isFirstOccurrenceInMonth,
                totalOccurrencesInMonth: completedLessonsInMonth.length
              });
              
              return sum + lessonEarnings;
            } else {
              console.log(`TeacherStatsService - Skipping earnings for subsequent occurrence in month ${lesson.id}:`, {
                monthKey,
                isFirstOccurrenceInMonth,
                totalOccurrencesInMonth: completedLessonsInMonth.length
              });
              return sum;
            }
          } else {
            // For per_lesson pricing, only count present students
            const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(
              attendance => attendance.status === AttendanceStatus.PRESENT
            ).length || 0;
            const lessonEarnings = lessonPrice * presentStudentsCount;
            
            console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (per_lesson):`, {
              lessonPrice,
              presentStudentsCount,
              lessonEarnings
            });
            
            return sum + lessonEarnings;
          }
        }
        return sum;
      }, 0);
      const totalAttendance = dayLessons.reduce((sum, lesson) => {
        // Only count present students for attendance
        const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(
          attendance => attendance.status === AttendanceStatus.PRESENT
        ).length || 0;
        return sum + presentStudentsCount;
      }, 0);
      const completedLessons = dayLessons.filter(l => l.status === LessonStatus.COMPLETED).length;
      const cancelledLessons = dayLessons.filter(l => l.status === LessonStatus.CANCELLED).length;
      const expiredLessons = dayLessons.filter(l => l.status === LessonStatus.EXPIRED).length;

      // Create or update daily stats
      let dailyStats = await this.teacherStatsRepository.findOne({
        where: {
          teacherId,
          period: StatsPeriod.DAILY,
          date: lessonDate
        }
      });

      if (!dailyStats) {
        dailyStats = this.teacherStatsRepository.create({
          teacherId,
          period: StatsPeriod.DAILY,
          date: lessonDate,
          totalLessons: 0,
          totalStudents: 0,
          totalAttendance: 0,
          totalEarnings: 0,
          completedLessons: 0,
          cancelledLessons: 0,
          expiredLessons: 0,
          averageEarningsPerLesson: 0,
          averageStudentsPerLesson: 0,
          completionRate: 0
        });
      }

      // Set the calculated values
      dailyStats.totalLessons = totalLessons;
      dailyStats.totalStudents = totalStudents;
      dailyStats.totalAttendance = totalAttendance;
      dailyStats.totalEarnings = totalEarnings;
      dailyStats.completedLessons = completedLessons;
      dailyStats.cancelledLessons = cancelledLessons;
      dailyStats.expiredLessons = expiredLessons;
      dailyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
      dailyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
      dailyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      await this.teacherStatsRepository.save(dailyStats);

      // Update weekly and monthly stats
      await this.updateWeeklyStatsFromDaily(teacherId, lessonDate);
      await this.updateMonthlyStatsFromDaily(teacherId, lessonDate);
    }

    console.log('TeacherStatsService - Stats initialization completed for teacher:', teacherId);
  }

  // Update weekly stats from daily stats
  private async updateWeeklyStatsFromDaily(teacherId: string, lessonDate: Date): Promise<void> {
    const weekStart = this.getWeekStart(lessonDate);
    
    let weeklyStats = await this.teacherStatsRepository.findOne({
      where: {
        teacherId,
        period: StatsPeriod.WEEKLY,
        date: weekStart
      }
    });

    if (!weeklyStats) {
      weeklyStats = this.teacherStatsRepository.create({
        teacherId,
        period: StatsPeriod.WEEKLY,
        date: weekStart,
        totalLessons: 0,
        totalStudents: 0,
        totalAttendance: 0,
        totalEarnings: 0,
        completedLessons: 0,
        cancelledLessons: 0,
        expiredLessons: 0,
        averageEarningsPerLesson: 0,
        averageStudentsPerLesson: 0,
        completionRate: 0
      });
    }

    // Get all daily stats for this week (Saturday to Friday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get to Friday
    weekEnd.setHours(23, 59, 59, 999);

    const dailyStatsForWeek = await this.teacherStatsRepository.find({
      where: {
        teacherId,
        period: StatsPeriod.DAILY,
        date: Between(weekStart, weekEnd)
      }
    });

    // Sum up daily stats
    weeklyStats.totalLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.totalLessons, 0);
    weeklyStats.totalStudents = dailyStatsForWeek.reduce((sum, stat) => sum + stat.totalStudents, 0);
    weeklyStats.totalAttendance = dailyStatsForWeek.reduce((sum, stat) => sum + stat.totalAttendance, 0);
    weeklyStats.totalEarnings = dailyStatsForWeek.reduce((sum, stat) => sum + parseFloat(stat.totalEarnings.toString()), 0);
    weeklyStats.completedLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.completedLessons, 0);
    weeklyStats.cancelledLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.cancelledLessons, 0);
    weeklyStats.expiredLessons = dailyStatsForWeek.reduce((sum, stat) => sum + stat.expiredLessons, 0);

    // Calculate averages
    weeklyStats.averageEarningsPerLesson = weeklyStats.totalLessons > 0 ? weeklyStats.totalEarnings / weeklyStats.totalLessons : 0;
    weeklyStats.averageStudentsPerLesson = weeklyStats.totalLessons > 0 ? weeklyStats.totalStudents / weeklyStats.totalLessons : 0;
    weeklyStats.completionRate = weeklyStats.totalLessons > 0 ? (weeklyStats.completedLessons / weeklyStats.totalLessons) * 100 : 0;

    await this.teacherStatsRepository.save(weeklyStats);
  }

  // Update monthly stats from daily stats
  private async updateMonthlyStatsFromDaily(teacherId: string, lessonDate: Date): Promise<void> {
    const monthStart = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), 1);
    
    let monthlyStats = await this.teacherStatsRepository.findOne({
      where: {
        teacherId,
        period: StatsPeriod.MONTHLY,
        date: monthStart
      }
    });

    if (!monthlyStats) {
      monthlyStats = this.teacherStatsRepository.create({
        teacherId,
        period: StatsPeriod.MONTHLY,
        date: monthStart,
        totalLessons: 0,
        totalStudents: 0,
        totalAttendance: 0,
        totalEarnings: 0,
        completedLessons: 0,
        cancelledLessons: 0,
        expiredLessons: 0,
        averageEarningsPerLesson: 0,
        averageStudentsPerLesson: 0,
        completionRate: 0
      });
    }

    // Get all daily stats for this month
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthStart.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const dailyStatsForMonth = await this.teacherStatsRepository.find({
      where: {
        teacherId,
        period: StatsPeriod.DAILY,
        date: Between(monthStart, monthEnd)
      }
    });

    // Sum up daily stats
    monthlyStats.totalLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.totalLessons, 0);
    monthlyStats.totalStudents = dailyStatsForMonth.reduce((sum, stat) => sum + stat.totalStudents, 0);
    monthlyStats.totalAttendance = dailyStatsForMonth.reduce((sum, stat) => sum + stat.totalAttendance, 0);
    monthlyStats.totalEarnings = dailyStatsForMonth.reduce((sum, stat) => sum + parseFloat(stat.totalEarnings.toString()), 0);
    monthlyStats.completedLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.completedLessons, 0);
    monthlyStats.cancelledLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.cancelledLessons, 0);
    monthlyStats.expiredLessons = dailyStatsForMonth.reduce((sum, stat) => sum + stat.expiredLessons, 0);

    // Calculate averages
    monthlyStats.averageEarningsPerLesson = monthlyStats.totalLessons > 0 ? monthlyStats.totalEarnings / monthlyStats.totalLessons : 0;
    monthlyStats.averageStudentsPerLesson = monthlyStats.totalLessons > 0 ? monthlyStats.totalStudents / monthlyStats.totalLessons : 0;
    monthlyStats.completionRate = monthlyStats.totalLessons > 0 ? (monthlyStats.completedLessons / monthlyStats.totalLessons) * 100 : 0;

    await this.teacherStatsRepository.save(monthlyStats);
  }

  // Manually recalculate and fix stats for a teacher
  async recalculateTeacherStats(teacherId: string): Promise<void> {
    console.log('TeacherStatsService - Recalculating stats for teacher:', teacherId);
    
    // Get all lessons for this teacher
    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['students']
    });

    console.log('TeacherStatsService - Found lessons for recalculation:', lessons.length);
    
    // Log each lesson's details
    lessons.forEach((lesson, index) => {
      console.log(`TeacherStatsService - Lesson ${index + 1}:`, {
        id: lesson.id,
        price: lesson.price,
        priceType: typeof lesson.price,
        scheduledDate: lesson.scheduledDate,
        status: lesson.status,
        studentsCount: lesson.students.length
      });
    });

    // Get attendance data
    const lessonIds = lessons.map(l => l.id);
    const attendanceData = await this.attendanceRepository.find({
      where: { lessonId: In(lessonIds) }
    });

    // Group lessons by date
    const lessonsByDate = new Map<string, Lesson[]>();
    lessons.forEach(lesson => {
      const lessonDate = new Date(lesson.scheduledDate);
      const dateKey = lessonDate.toISOString().split('T')[0];
      
      console.log('TeacherStatsService - Lesson date processing:', {
        lessonId: lesson.id,
        originalScheduledDate: lesson.scheduledDate,
        lessonDate: lessonDate,
        dateKey: dateKey
      });
      
      if (!lessonsByDate.has(dateKey)) {
        lessonsByDate.set(dateKey, []);
      }
      lessonsByDate.get(dateKey).push(lesson);
    });

    console.log('TeacherStatsService - Lessons grouped by date:', Array.from(lessonsByDate.entries()).map(([date, lessons]) => ({
      date,
      lessonCount: lessons.length,
      lessonIds: lessons.map(l => l.id)
    })));

    // Group attendance by lesson
    const attendanceByLesson = attendanceData.reduce((acc, attendance) => {
      if (!acc[attendance.lessonId]) {
        acc[attendance.lessonId] = [];
      }
      acc[attendance.lessonId].push(attendance);
      return acc;
    }, {});

    // Process each date
    for (const [dateKey, dayLessons] of lessonsByDate) {
      const lessonDate = new Date(dateKey);
      
      console.log('TeacherStatsService - Processing date:', dateKey, 'with lessons:', dayLessons.length);
      
      // Calculate totals for this day with proper number handling
      const totalLessons = dayLessons.length;
      const totalStudents = dayLessons.reduce((sum, lesson) => sum + lesson.students.length, 0);
      
      // Calculate earnings based on completed lessons with actual attendance
      const totalEarnings = dayLessons.reduce((sum, lesson) => {
        if (lesson.status === LessonStatus.COMPLETED) {
          const lessonPrice = parseFloat(lesson.price?.toString() || '0');
          
          if (lesson.pricingType === PricingType.MONTHLY) {
            // For monthly pricing, only charge on the first occurrence of each month
            const lessonScheduledDate = new Date(lesson.scheduledDate);
            const monthKey = `${lessonScheduledDate.getFullYear()}-${lessonScheduledDate.getMonth() + 1}`;
            
            // Check if this is the first occurrence of this lesson in this month
            const monthStart = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), 1);
            const monthEnd = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth() + 1, 0, 23, 59, 59, 999);
            
            // Get all completed lessons for this teacher in this month with the same lesson ID
            const completedLessonsInMonth = dayLessons.filter(l => 
              l.id === lesson.id && // Same lesson ID (recurring lesson)
              l.status === LessonStatus.COMPLETED &&
              l.scheduledDate >= monthStart &&
              l.scheduledDate <= monthEnd
            );

            // Filter out the current lesson from the count (since it was just completed)
            const otherCompletedLessonsInMonth = completedLessonsInMonth.filter(l => 
              l.scheduledDate.getTime() !== lessonScheduledDate.getTime()
            );

            // If no other completed lessons in this month yet, this is the first occurrence
            const isFirstOccurrenceInMonth = otherCompletedLessonsInMonth.length === 0;

            if (isFirstOccurrenceInMonth) {
              // Calculate earnings for this month (only on first occurrence)
              const enrolledStudentsCount = lesson.students?.length || 0;
              const lessonEarnings = lessonPrice * enrolledStudentsCount;
              
              console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (monthly):`, {
                lessonPrice,
                enrolledStudentsCount,
                lessonEarnings,
                monthKey,
                isFirstOccurrenceInMonth,
                totalOccurrencesInMonth: completedLessonsInMonth.length
              });
              
              return sum + lessonEarnings;
            } else {
              console.log(`TeacherStatsService - Skipping earnings for subsequent occurrence in month ${lesson.id}:`, {
                monthKey,
                isFirstOccurrenceInMonth,
                totalOccurrencesInMonth: completedLessonsInMonth.length
              });
              return sum;
            }
          } else {
            // For per_lesson pricing, only count present students
            const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(
              attendance => attendance.status === AttendanceStatus.PRESENT
            ).length || 0;
            const lessonEarnings = lessonPrice * presentStudentsCount;
            
            console.log(`TeacherStatsService - Completed lesson ${lesson.id} earnings (per_lesson):`, {
              lessonPrice,
              presentStudentsCount,
              lessonEarnings
            });
            
            return sum + lessonEarnings;
          }
        }
        return sum;
      }, 0);
      
      const totalAttendance = dayLessons.reduce((sum, lesson) => {
        // Only count present students for attendance
        const presentStudentsCount = attendanceByLesson[lesson.id]?.filter(
          attendance => attendance.status === AttendanceStatus.PRESENT
        ).length || 0;
        return sum + presentStudentsCount;
      }, 0);
      const completedLessons = dayLessons.filter(l => l.status === LessonStatus.COMPLETED).length;
      const cancelledLessons = dayLessons.filter(l => l.status === LessonStatus.CANCELLED).length;
      const expiredLessons = dayLessons.filter(l => l.status === LessonStatus.EXPIRED).length;

      console.log('TeacherStatsService - Calculated values for', dateKey, ':', {
        totalLessons,
        totalStudents,
        totalEarnings,
        totalEarningsType: typeof totalEarnings,
        totalAttendance,
        completedLessons,
        cancelledLessons,
        expiredLessons
      });

      // Create or update daily stats
      let dailyStats = await this.teacherStatsRepository.findOne({
        where: {
          teacherId,
          period: StatsPeriod.DAILY,
          date: lessonDate
        }
      });

      if (!dailyStats) {
        dailyStats = this.teacherStatsRepository.create({
          teacherId,
          period: StatsPeriod.DAILY,
          date: lessonDate,
          totalLessons: 0,
          totalStudents: 0,
          totalAttendance: 0,
          totalEarnings: 0,
          completedLessons: 0,
          cancelledLessons: 0,
          expiredLessons: 0,
          averageEarningsPerLesson: 0,
          averageStudentsPerLesson: 0,
          completionRate: 0
        });
      }

      // Set the calculated values with proper number handling
      dailyStats.totalLessons = totalLessons;
      dailyStats.totalStudents = totalStudents;
      dailyStats.totalAttendance = totalAttendance;
      dailyStats.totalEarnings = totalEarnings; // This should be a number now
      dailyStats.completedLessons = completedLessons;
      dailyStats.cancelledLessons = cancelledLessons;
      dailyStats.expiredLessons = expiredLessons;
      dailyStats.averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
      dailyStats.averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
      dailyStats.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      console.log('TeacherStatsService - Saving daily stats for', dateKey, ':', {
        totalLessons: dailyStats.totalLessons,
        totalStudents: dailyStats.totalStudents,
        totalAttendance: dailyStats.totalAttendance,
        totalEarnings: dailyStats.totalEarnings,
        totalEarningsType: typeof dailyStats.totalEarnings,
        completedLessons: dailyStats.completedLessons,
        completionRate: dailyStats.completionRate
      });

      await this.teacherStatsRepository.save(dailyStats);

      // Update weekly and monthly stats
      await this.updateWeeklyStatsFromDaily(teacherId, lessonDate);
      await this.updateMonthlyStatsFromDaily(teacherId, lessonDate);
    }

    console.log('TeacherStatsService - Stats recalculation completed for teacher:', teacherId);
  }

  // Debug method to check teacher stats
  async debugTeacherStats(teacherId: string): Promise<any> {
    const allStats = await this.teacherStatsRepository.find({
      where: { teacherId },
      order: { period: 'ASC', date: 'ASC' }
    });

    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      order: { scheduledDate: 'ASC' }
    });

    const completedLessons = lessons.filter(l => l.status === LessonStatus.COMPLETED);
    const createdLessons = lessons.filter(l => l.status !== LessonStatus.CANCELLED && l.status !== LessonStatus.EXPIRED);

    return {
      teacherId,
      totalStatsRecords: allStats.length,
      totalLessons: lessons.length,
      createdLessons: createdLessons.length,
      completedLessons: completedLessons.length,
      statsByPeriod: {
        daily: allStats.filter(s => s.period === StatsPeriod.DAILY),
        weekly: allStats.filter(s => s.period === StatsPeriod.WEEKLY),
        monthly: allStats.filter(s => s.period === StatsPeriod.MONTHLY)
      },
      lessons: lessons.map(l => ({
        id: l.id,
        title: l.title,
        status: l.status,
        scheduledDate: l.scheduledDate,
        pricingType: l.pricingType,
        price: l.price,
        recurrenceType: l.recurrenceType
      })),
      stats: allStats.map(s => ({
        id: s.id,
        period: s.period,
        date: s.date,
        totalLessons: s.totalLessons,
        completedLessons: s.completedLessons,
        totalEarnings: s.totalEarnings,
        completionRate: s.completionRate
      }))
    };
  }

  // Clear all stats for a teacher (for debugging)
  async clearTeacherStats(teacherId: string): Promise<void> {
    await this.teacherStatsRepository.delete({ teacherId });
  }
} 