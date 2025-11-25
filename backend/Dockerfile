# ============================
# 1 - Builder Image
# ============================
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /workspace

# Copy Gradle wrapper files first
COPY gradlew .
COPY gradlew.bat .
COPY gradle gradle

# Copy build files
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# Make gradlew executable and build
RUN chmod +x gradlew && \
    ./gradlew clean bootJar --no-daemon

# ============================
# 2 - Runtime Image
# ============================
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=builder /workspace/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
