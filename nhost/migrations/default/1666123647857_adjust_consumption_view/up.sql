DROP VIEW consumption;

CREATE VIEW consumption AS (
    WITH cte AS (
        SELECT
            id,
            time,
            value,
            LAG(value, 1) OVER (ORDER BY time) previous_value,
            LAG(time) OVER (ORDER BY time) previous_time
        FROM measurement
)
    SELECT
        id,
        previous_time AS time_from,
        time AS time_to,
        EXTRACT(epoch FROM (time - previous_time)) AS interval,
        value - previous_value AS consumption
    FROM
        cte
    WHERE
        previous_value IS NOT NULL);

