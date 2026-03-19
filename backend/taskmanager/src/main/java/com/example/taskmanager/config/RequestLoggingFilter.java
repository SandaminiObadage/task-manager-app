package com.example.taskmanager.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final String MDC_REQUEST_ID_KEY = "requestId";
    private static final String REQUEST_ID_ATTRIBUTE = "requestId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        long startNanos = System.nanoTime();
        MDC.put(MDC_REQUEST_ID_KEY, requestId);
        request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            int status = response.getStatus();

            if (status >= 500) {
                log.error("requestId={} method={} path={} status={} durationMs={}",
                        requestId,
                        request.getMethod(),
                        request.getRequestURI(),
                        status,
                        durationMs);
            } else if (status >= 400) {
                log.warn("requestId={} method={} path={} status={} durationMs={}",
                        requestId,
                        request.getMethod(),
                        request.getRequestURI(),
                        status,
                        durationMs);
            } else {
                log.info("requestId={} method={} path={} status={} durationMs={}",
                        requestId,
                        request.getMethod(),
                        request.getRequestURI(),
                        status,
                        durationMs);
            }

            MDC.remove(MDC_REQUEST_ID_KEY);
        }
    }
}
