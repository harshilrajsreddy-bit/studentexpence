-- ============================================================
-- Student SpendSense - Demo Seed Data (for Supabase PostgreSQL)
-- Seed: seed.sql
-- Fictional student user: Aarav Sharma (Computer Science undergrad)
-- ============================================================

-- Assuming demo user UUID
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, full_name, currency, monthly_pocket_money, savings_target, expected_pocket_day)
    VALUES (
        demo_user_id,
        'Aarav Sharma',
        '₹',
        9500.00,
        2500.00,
        1
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        monthly_pocket_money = EXCLUDED.monthly_pocket_money;

    -- Clear previous transactions for demo user
    DELETE FROM public.transactions WHERE user_id = demo_user_id;

    -- Insert Incomes
    INSERT INTO public.transactions (user_id, type, amount, category, description, transaction_date, payment_method, notes)
    VALUES
        (demo_user_id, 'income', 8500.00, 'Pocket money', 'Monthly pocket money from parents', CURRENT_DATE - INTERVAL '25 days', 'Bank Transfer', 'Direct bank deposit'),
        (demo_user_id, 'income', 1500.00, 'Freelance work', 'Web design for senior thesis presentation', CURRENT_DATE - INTERVAL '14 days', 'UPI', 'Stripe payout to UPI'),
        (demo_user_id, 'income', 500.00, 'Gifts', 'Birthday gift from uncle', CURRENT_DATE - INTERVAL '8 days', 'Cash', 'Festival gift');

    -- Insert Realistic Student Expenses (across categories and dates)
    INSERT INTO public.transactions (user_id, type, amount, category, description, transaction_date, payment_method, notes)
    VALUES
        -- Food & Snacks
        (demo_user_id, 'expense', 180.00, 'Food and snacks', 'Campus Canteen lunch & chai with friends', CURRENT_DATE - INTERVAL '24 days', 'UPI', 'Quick lunch'),
        (demo_user_id, 'expense', 260.00, 'Food and snacks', 'Evening Biryani bowl near hostel', CURRENT_DATE - INTERVAL '22 days', 'UPI', 'Dinner'),
        (demo_user_id, 'expense', 90.00, 'Food and snacks', 'Tea and samosa stall break', CURRENT_DATE - INTERVAL '20 days', 'Cash', 'Snacks'),
        (demo_user_id, 'expense', 340.00, 'Food and snacks', 'Weekend pizza night at dorm', CURRENT_DATE - INTERVAL '18 days', 'Card', 'Shared treat'),
        (demo_user_id, 'expense', 120.00, 'Food and snacks', 'Cold coffee & cookies at library cafe', CURRENT_DATE - INTERVAL '15 days', 'UPI', 'Study fuel'),
        (demo_user_id, 'expense', 220.00, 'Food and snacks', 'Mess food top-up & fruits', CURRENT_DATE - INTERVAL '12 days', 'UPI', 'Weekly fruits'),
        (demo_user_id, 'expense', 150.00, 'Food and snacks', 'Shawarma wrap after lab', CURRENT_DATE - INTERVAL '9 days', 'UPI', 'Quick dinner'),
        (demo_user_id, 'expense', 85.00, 'Food and snacks', 'Snack bar chips & buttermilk', CURRENT_DATE - INTERVAL '6 days', 'Cash', 'Between classes'),
        (demo_user_id, 'expense', 210.00, 'Food and snacks', 'College canteen breakfast & juice', CURRENT_DATE - INTERVAL '3 days', 'UPI', 'Morning breakfast'),
        (demo_user_id, 'expense', 140.00, 'Food and snacks', 'After-class momos and drinks', CURRENT_DATE - INTERVAL '1 day', 'UPI', 'Evening hangout'),

        -- College Expenses
        (demo_user_id, 'expense', 450.00, 'College expenses', 'Data Structures & Algorithms reference textbook', CURRENT_DATE - INTERVAL '23 days', 'UPI', 'College book'),
        (demo_user_id, 'expense', 120.00, 'College expenses', 'Lab record notebooks and circuit components', CURRENT_DATE - INTERVAL '16 days', 'Cash', 'Lab requirements'),
        (demo_user_id, 'expense', 75.00, 'College expenses', 'Project report color printouts & binding', CURRENT_DATE - INTERVAL '7 days', 'UPI', 'Submission report'),

        -- Transportation
        (demo_user_id, 'expense', 350.00, 'Transportation', 'Monthly student metro pass recharge', CURRENT_DATE - INTERVAL '25 days', 'Card', 'Metro card recharge'),
        (demo_user_id, 'expense', 110.00, 'Transportation', 'Auto-rickshaw ride during heavy rain', CURRENT_DATE - INTERVAL '17 days', 'UPI', 'Shared ride'),
        (demo_user_id, 'expense', 95.00, 'Transportation', 'Cab share to tech hackathon venue', CURRENT_DATE - INTERVAL '10 days', 'UPI', 'Event travel'),
        (demo_user_id, 'expense', 60.00, 'Transportation', 'Bus ticket to railway station', CURRENT_DATE - INTERVAL '4 days', 'Cash', 'Transit'),

        -- Shopping
        (demo_user_id, 'expense', 699.00, 'Shopping', 'Campus hoodie and graphic t-shirt', CURRENT_DATE - INTERVAL '19 days', 'Card', 'Online order'),
        (demo_user_id, 'expense', 320.00, 'Shopping', 'Stationery kit, sticky notes, highlighters', CURRENT_DATE - INTERVAL '13 days', 'UPI', 'Study supplies'),

        -- Entertainment
        (demo_user_id, 'expense', 380.00, 'Entertainment', 'Weekend movie ticket with classmates', CURRENT_DATE - INTERVAL '21 days', 'UPI', 'Sci-fi movie show'),
        (demo_user_id, 'expense', 199.00, 'Entertainment', 'Student Spotify Premium subscription', CURRENT_DATE - INTERVAL '15 days', 'UPI', 'Music streaming'),

        -- Mobile and Internet
        (demo_user_id, 'expense', 349.00, 'Mobile and internet', '5G 84-day student phone recharge', CURRENT_DATE - INTERVAL '22 days', 'UPI', 'Mobile carrier recharge'),

        -- Health
        (demo_user_id, 'expense', 160.00, 'Health', 'Cold tablets, vitamins, and ORS from pharmacy', CURRENT_DATE - INTERVAL '11 days', 'UPI', 'Medical emergency pack');

    -- Insert Budgets
    INSERT INTO public.budgets (user_id, category, amount, month)
    VALUES
        (demo_user_id, 'Overall', 7000.00, TO_CHAR(CURRENT_DATE, 'YYYY-MM')),
        (demo_user_id, 'Food and snacks', 2800.00, TO_CHAR(CURRENT_DATE, 'YYYY-MM')),
        (demo_user_id, 'Transportation', 800.00, TO_CHAR(CURRENT_DATE, 'YYYY-MM')),
        (demo_user_id, 'College expenses', 1200.00, TO_CHAR(CURRENT_DATE, 'YYYY-MM')),
        (demo_user_id, 'Entertainment', 800.00, TO_CHAR(CURRENT_DATE, 'YYYY-MM')),
        (demo_user_id, 'Shopping', 1000.00, TO_CHAR(CURRENT_DATE, 'YYYY-MM'))
    ON CONFLICT (user_id, category, month) DO UPDATE SET amount = EXCLUDED.amount;

    -- Insert Savings Goals
    DELETE FROM public.savings_goals WHERE user_id = demo_user_id;
    INSERT INTO public.savings_goals (user_id, title, target_amount, saved_amount, deadline, status)
    VALUES
        (demo_user_id, 'Noise-canceling Coding Headphones', 4500.00, 2800.00, CURRENT_DATE + INTERVAL '45 days', 'in_progress'),
        (demo_user_id, 'Semester Break Goa Trip', 8000.00, 3500.00, CURRENT_DATE + INTERVAL '90 days', 'in_progress'),
        (demo_user_id, 'Emergency Medical Fund', 3000.00, 3000.00, CURRENT_DATE - INTERVAL '5 days', 'completed');

END $$;
