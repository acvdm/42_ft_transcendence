#1/bin/bash

TARGET_USER="$1"

if [ -z "$TARGET_USER" ]; then
    echo "Error: you must enter an alias."
    echo "Usage: add_stats.sh <alias>"
    exit 1
fi

USER_ID=$(docker exec -i user sqlite3 /app/data/user.sqlite <<EOF
SELECT id FROM "USERS" WHERE alias = '$TARGET_USER'
EOF
)

if [[ ! "$USER_ID" =~ ^[0-9]+$ ]]; then
    echo "Error: User '$TARGET_USER' not found"
    exit 1
fi


# Tableau d'adversaires
OPPONENTS=("AnneChat" "BadBunny13" "Faustoche" "Cassou" "Natsuw" "NaughtyCat2")

for OPPONENT in "${OPPONENTS[@]}"; do
    # On décide au hasard le game_type
    if [ $((RANDOM % 2)) -eq 1 ]; then
        GAME_TYPE='remote'
    else
        GAME_TYPE='local'
    fi

    # On décide au hasard qui gagne
    if [ $((RANDOM % 2)) -eq 1 ]; then
        # si USER gagne
        SCORE_USER=11
        SCORE_OPP=$((RANDOM % 10))
        WINNER="$TARGET_USER"
        IS_WINNER=1
    else
        # l'adversaire gagne
        SCORE_OPP=11
        SCORE_USER=$((RANDOM % 10))
        WINNER="$OPPONENT"
        IS_WINNER=0
    fi

    # Creation du match
    MATCH_ID=$(docker exec -i game sqlite3 /app/data/game.sqlite <<EOF
    INSERT INTO "MATCHES" (game_type, player1_alias, player2_alias, score_p1, score_p2, winner_alias, status, total_duration_in_minutes, round)
    VALUES('$GAME_TYPE', '$TARGET_USER', '$OPPONENT', $SCORE_USER, $SCORE_OPP, '$WINNER', 'finished', 1, '1v1')
    RETURNING match_id
EOF
    )

    if ! [[ "$MATCH_ID" =~ [0-9]+$ ]]; then
        echo "Error while creating match. SQL response: $MATCH_ID"
        exit 1
    fi


    docker exec -i game sqlite3 /app/data/game.sqlite << EOF
    INSERT INTO "PLAYER_MATCH" (match_id, game_type, user_id, opponent, score, opponent_score, is_winner)
    VALUES($MATCH_ID, '$GAME_TYPE', $USER_ID, '$OPPONENT', $SCORE_USER, $SCORE_OPP, $IS_WINNER);
EOF

    docker exec -i game sqlite3 /app/data/game.sqlite << EOF
    INSERT OR IGNORE INTO "STATS" (user_id)
    VALUES ($USER_ID);
EOF

    docker exec -i game sqlite3 /app/data/game.sqlite << EOF
    UPDATE "STATS" 
    SET 
        wins = wins + $IS_WINNER,
        losses = losses + (1 - $IS_WINNER),
        total_score = total_score + $SCORE_USER,
        current_win_streak = CASE WHEN $IS_WINNER = 1 THEN current_win_streak + 1 ELSE 0 END,
        total_play_time_minutes = total_play_time_minutes + 1
    WHERE user_id = $USER_ID;
EOF

done

echo "Done"

