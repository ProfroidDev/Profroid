# =========================
# 1. BUILD STAGE
# =========================
FROM gradle:8.8-jdk17 AS builder
WORKDIR /app

COPY . .
RUN gradle clean bootJar --no-daemon

# =========================
# 2. RUN STAGE
# =========================
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
