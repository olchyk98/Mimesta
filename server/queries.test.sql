-- Get number of created cards by this user in this month
SELECT COUNT(*) FROM Cards WHERE creatorid = '1' AND (DATE_PART('month', NOW()) - DATE_PART('month', addtime)) <= 1